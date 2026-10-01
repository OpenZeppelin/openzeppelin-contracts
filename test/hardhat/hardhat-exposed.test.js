import { createHardhatRuntimeEnvironment } from 'hardhat/hre';
import { expect } from 'chai';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import hardhatExposed from '../../hardhat/hardhat-exposed/plugin.ts';

const contract = name => `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\ncontract ${name} {}\n`;

describe('hardhat-exposed stale files', function () {
  beforeEach(function () {
    this.root = fs.mkdtempSync(path.join(os.tmpdir(), 'hardhat-exposed-'));
    fs.mkdirSync(path.join(this.root, 'contracts'));
    fs.writeFileSync(path.join(this.root, 'package.json'), '{}');

    this.write = (name, source = name) =>
      fs.writeFileSync(path.join(this.root, 'contracts', `${name}.sol`), contract(source));
    this.remove = name => fs.rmSync(path.join(this.root, 'contracts', `${name}.sol`));
    this.rename = (from, to) => {
      this.remove(from);
      this.write(to);
    };
    this.wrappers = () => {
      const dir = path.join(this.root, 'contracts-exposed', 'contracts');
      return fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
    };
    // A new environment per build mimics separate CLI invocations
    this.build = async () => {
      const hre = await createHardhatRuntimeEnvironment(
        { plugins: [hardhatExposed], solidity: '0.8.35', paths: { sources: 'contracts' } },
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
    expect(this.wrappers()).to.deep.equal(['A.sol', 'B.sol']);
  });

  it('does not regenerate anything when nothing changed', async function () {
    this.write('A');
    await this.build();
    const wrapper = path.join(this.root, 'contracts-exposed', 'contracts', 'A.sol');
    const before = fs.statSync(wrapper).mtimeMs;
    await this.build();
    expect(fs.statSync(wrapper).mtimeMs).to.equal(before);
  });

  it('removes the wrapper of a deleted source', async function () {
    this.write('A');
    this.write('B');
    await this.build();
    this.remove('A');
    await this.build();
    expect(this.wrappers()).to.deep.equal(['B.sol']);
  });

  it('removes the output directory content when the last source is deleted', async function () {
    this.write('A');
    await this.build();
    this.remove('A');
    await this.build();
    expect(this.wrappers()).to.deep.equal([]);
  });

  it('replaces the wrapper of a renamed source', async function () {
    this.write('Before');
    await this.build();
    this.rename('Before', 'After');
    await this.build();
    expect(this.wrappers()).to.deep.equal(['After.sol']);
  });

  it('regenerates a wrapper deleted by hand', async function () {
    this.write('A');
    await this.build();
    fs.rmSync(path.join(this.root, 'contracts-exposed', 'contracts', 'A.sol'));
    await this.build();
    expect(this.wrappers()).to.deep.equal(['A.sol']);
  });

  it('removes stale wrappers when there is no manifest', async function () {
    this.write('A');
    await this.build();
    const outDir = path.join(this.root, 'contracts-exposed');
    fs.copyFileSync(path.join(outDir, 'contracts', 'A.sol'), path.join(outDir, 'contracts', 'Stale.sol'));
    fs.rmSync(path.join(outDir, 'manifest.json'));
    await this.build();
    expect(this.wrappers()).to.deep.equal(['A.sol']);
  });
});
