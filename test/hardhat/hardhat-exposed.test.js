import { createHardhatRuntimeEnvironment } from 'hardhat/hre';
import { expect } from 'chai';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import hardhatExposed from '../../hardhat/hardhat-exposed/plugin.ts';

const contract = name => `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ${name} {}
`;

describe('hardhat-exposed stale files', function () {
  beforeEach(function () {
    this.root = fs.mkdtempSync(path.join(os.tmpdir(), 'hardhat-exposed-'));
    this.outDir = path.join(this.root, 'contracts-exposed');
    fs.mkdirSync(path.join(this.root, 'contracts'));
    fs.writeFileSync(path.join(this.root, 'package.json'), '{}');

    this.source = name => path.join(this.root, 'contracts', `${name}.sol`);
    this.wrapper = name => path.join(this.outDir, 'contracts', `${name}.sol`);
    this.write = (name, source = path.basename(name)) => {
      fs.mkdirSync(path.dirname(this.source(name)), { recursive: true });
      fs.writeFileSync(this.source(name), contract(source));
    };
    this.remove = name => fs.rmSync(this.source(name));
    this.rename = (from, to) => {
      this.remove(from);
      this.write(to);
    };
    this.wrappers = () => {
      const list = dir =>
        fs.existsSync(dir)
          ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
              const entryPath = path.join(dir, entry.name);
              return entry.isDirectory() ? list(entryPath) : [entryPath];
            })
          : [];
      return list(this.outDir)
        .map(file => path.relative(this.outDir, file))
        .filter(file => file !== 'manifest.json')
        .sort();
    };
    this.manifest = () => path.join(this.outDir, 'manifest.json');
    // A new environment per build mimics separate CLI invocations
    this.build = async exposed => {
      const hre = await createHardhatRuntimeEnvironment(
        { plugins: [hardhatExposed], solidity: '0.8.35', paths: { sources: 'contracts' }, exposed },
        {},
        this.root,
      );
      await hre.tasks.getTask('build').run({});
    };
  });

  afterEach(function () {
    fs.rmSync(this.root, { recursive: true, force: true });
  });

  it('generates a wrapper for each source', async function () {
    this.write('A');
    this.write('B');
    await this.build();
    expect(this.wrappers()).to.deep.equal(['contracts/A.sol', 'contracts/B.sol']);
  });

  it('does not regenerate anything when nothing changed', async function () {
    this.write('A');
    await this.build();
    const before = fs.statSync(this.wrapper('A')).mtimeMs;
    await this.build();
    expect(fs.statSync(this.wrapper('A')).mtimeMs).to.equal(before);
  });

  it('only regenerates the wrapper of a modified source', async function () {
    this.write('A');
    this.write('B');
    await this.build();
    const past = new Date(0);
    fs.utimesSync(this.wrapper('A'), past, past);
    fs.utimesSync(this.wrapper('B'), past, past);
    fs.appendFileSync(this.source('A'), '// modified\n');
    await this.build();
    expect(fs.statSync(this.wrapper('A')).mtimeMs).to.be.greaterThan(0);
    expect(fs.statSync(this.wrapper('B')).mtimeMs).to.equal(0);
  });

  it('removes the wrapper of a deleted source', async function () {
    this.write('A');
    this.write('B');
    await this.build();
    this.remove('A');
    await this.build();
    expect(this.wrappers()).to.deep.equal(['contracts/B.sol']);
  });

  it('removes the wrapper directory when the last source is deleted', async function () {
    this.write('A');
    await this.build();
    this.remove('A');
    await this.build();
    expect(this.wrappers()).to.deep.equal([]);
    expect(fs.existsSync(path.join(this.outDir, 'contracts'))).to.equal(false);
  });

  it('removes the wrapper and its empty directories for a deleted nested source', async function () {
    this.write('A');
    this.write('nested/deep/B');
    await this.build();
    this.remove('nested/deep/B');
    await this.build();
    expect(this.wrappers()).to.deep.equal(['contracts/A.sol']);
    expect(fs.existsSync(path.join(this.outDir, 'contracts', 'nested'))).to.equal(false);
  });

  it('keeps the directory of a deleted source while other wrappers remain in it', async function () {
    this.write('nested/A');
    this.write('nested/B');
    await this.build();
    this.remove('nested/A');
    await this.build();
    expect(this.wrappers()).to.deep.equal(['contracts/nested/B.sol']);
  });

  it('replaces the wrapper of a renamed source', async function () {
    this.write('Before');
    await this.build();
    this.rename('Before', 'After');
    await this.build();
    expect(this.wrappers()).to.deep.equal(['contracts/After.sol']);
  });

  it('replaces the wrapper of a source moved to another directory', async function () {
    this.write('A');
    await this.build();
    this.remove('A');
    this.write('moved/A');
    await this.build();
    expect(this.wrappers()).to.deep.equal(['contracts/moved/A.sol']);
  });

  it('regenerates a wrapper deleted by hand', async function () {
    this.write('A');
    await this.build();
    fs.rmSync(this.wrapper('A'));
    await this.build();
    expect(this.wrappers()).to.deep.equal(['contracts/A.sol']);
  });

  describe('configuration changes', function () {
    it('removes the wrapper of a source that becomes excluded', async function () {
      this.write('A');
      this.write('B');
      await this.build();
      await this.build({ exclude: ['contracts/B.sol'] });
      expect(this.wrappers()).to.deep.equal(['contracts/A.sol']);
    });

    it('removes the wrappers of sources that are no longer included', async function () {
      this.write('A');
      this.write('nested/B');
      await this.build();
      await this.build({ include: ['contracts/nested/**/*.sol'] });
      expect(this.wrappers()).to.deep.equal(['contracts/nested/B.sol']);
    });
  });

  describe('manifest', function () {
    it('removes stale wrappers when there is no manifest', async function () {
      this.write('A');
      await this.build();
      fs.copyFileSync(this.wrapper('A'), this.wrapper('Stale'));
      fs.rmSync(this.manifest());
      await this.build();
      expect(this.wrappers()).to.deep.equal(['contracts/A.sol']);
    });

    for (const [description, content] of [
      ['is not valid JSON', 'not json'],
      ['is not an object', '[]'],
      ['maps a file to something else than a list of strings', '{"contracts-exposed/contracts/A.sol": [1]}'],
    ]) {
      it(`starts over when the manifest ${description}`, async function () {
        this.write('A');
        await this.build();
        fs.copyFileSync(this.wrapper('A'), this.wrapper('Stale'));
        fs.writeFileSync(this.manifest(), content);
        await this.build();
        expect(this.wrappers()).to.deep.equal(['contracts/A.sol']);
      });
    }

    it('never deletes files outside of the output directory', async function () {
      this.write('A');
      await this.build();
      const outside = path.join(this.root, 'outside.txt');
      fs.writeFileSync(outside, 'keep me');
      const manifest = JSON.parse(fs.readFileSync(this.manifest(), 'utf8'));
      manifest['outside.txt'] = ['contracts/Gone.sol'];
      manifest['../outside.txt'] = ['contracts/Gone.sol'];
      fs.writeFileSync(this.manifest(), JSON.stringify(manifest));
      await this.build();
      expect(fs.readFileSync(outside, 'utf8')).to.equal('keep me');
    });
  });

  describe('imports option', function () {
    beforeEach(function () {
      const dependency = path.join(this.root, 'node_modules', 'dep');
      fs.mkdirSync(dependency, { recursive: true });
      fs.writeFileSync(path.join(dependency, 'package.json'), '{"name":"dep","version":"1.0.0"}');
      fs.writeFileSync(path.join(dependency, 'Dep.sol'), contract('Dep'));
      fs.writeFileSync(
        this.source('Importer'),
        contract('Importer').replace('contract Importer', 'import {Dep} from "dep/Dep.sol";\ncontract Importer is Dep'),
      );
      this.importedWrapper = () => this.wrappers().find(file => file.endsWith('Dep.sol'));
    });

    it('keeps the wrapper of an imported contract when nothing changed', async function () {
      await this.build({ imports: true });
      const imported = this.importedWrapper();
      expect(imported).to.not.equal(undefined);
      await this.build({ imports: true });
      expect(this.importedWrapper()).to.equal(imported);
    });

    it('removes the wrapper of an imported contract along with the source importing it', async function () {
      await this.build({ imports: true });
      this.remove('Importer');
      await this.build({ imports: true });
      expect(this.wrappers()).to.deep.equal([]);
    });
  });
});
