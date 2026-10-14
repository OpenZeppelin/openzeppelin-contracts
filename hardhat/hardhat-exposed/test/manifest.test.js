import { expect } from 'chai';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ExposedManifest } from '../src/internal/manifest.ts';

// Unit tests for the stale-exposed-file bookkeeping. The manifest is pure fs/path, so everything runs against a
// throwaway temp directory: `rootDir` stands in for the project root, `outDir` for `contracts-exposed`.
describe('hardhat-exposed: manifest', function () {
  let rootDir;
  let outDir;

  // Absolute path of a (pretend) root source and of its exposed file, mirroring the real layout.
  const root = p => path.join(rootDir, p);
  const exposed = p => path.join(outDir, p);
  // Create an exposed file on disk so prune has something real to delete.
  const write = abs => {
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, '// exposed\n');
  };
  const exists = abs => fs.existsSync(abs);

  beforeEach(function () {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oz-exposed-'));
    outDir = path.join(rootDir, 'contracts-exposed');
  });

  afterEach(function () {
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  describe('load', function () {
    it('returns undefined when the manifest is missing', function () {
      expect(ExposedManifest.load(rootDir, outDir)).to.equal(undefined);
    });

    it('returns undefined when the manifest is malformed', function () {
      for (const bad of ['[]', '42', 'not json', '{"a.sol": 123}', '{"a.sol": [1]}']) {
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, 'manifest.json'), bad);
        expect(ExposedManifest.load(rootDir, outDir), bad).to.equal(undefined);
      }
    });

    it('round-trips a persisted manifest', function () {
      const rootA = root('contracts/A.sol');
      const exposedA = exposed('contracts/A.sol');
      write(exposedA);

      const m = ExposedManifest.empty(rootDir, outDir);
      m.setGenerated([rootA], new Map([[exposedA, [rootA]]]));
      m.prune([rootA]); // persists manifest.json

      // Reloaded manifest knows about the file: de-exposing the root deletes it.
      const reloaded = ExposedManifest.load(rootDir, outDir);
      expect(reloaded).to.not.equal(undefined);
      reloaded.prune([]);
      expect(exists(exposedA)).to.equal(false);
    });
  });

  describe('prune', function () {
    it("deletes a root's own exposed file once the root is no longer exposed", function () {
      const rootA = root('contracts/A.sol');
      const exposedA = exposed('contracts/A.sol');
      write(exposedA);

      const m = ExposedManifest.empty(rootDir, outDir);
      m.setGenerated([rootA], new Map([[exposedA, [rootA]]]));

      m.prune([rootA]); // still exposed
      expect(exists(exposedA)).to.equal(true);

      m.prune([]); // de-exposed / removed
      expect(exists(exposedA)).to.equal(false);
    });

    it('keeps a shared file while any owner survives, deletes it once all are gone', function () {
      const rootA = root('contracts/A.sol');
      const rootB = root('contracts/B.sol');
      const exposedA = exposed('contracts/A.sol');
      const exposedB = exposed('contracts/B.sol');
      const exposedShared = exposed('contracts/Shared.sol');
      [exposedA, exposedB, exposedShared].forEach(write);

      const m = ExposedManifest.empty(rootDir, outDir);
      m.setGenerated(
        [rootA, rootB],
        new Map([
          [exposedA, [rootA]],
          [exposedB, [rootB]],
          [exposedShared, [rootA, rootB]], // attributed to all roots of the job
        ]),
      );

      m.prune([rootA, rootB]);
      [exposedA, exposedB, exposedShared].forEach(f => expect(exists(f), f).to.equal(true));

      m.prune([rootA]); // B gone
      expect(exists(exposedB)).to.equal(false);
      expect(exists(exposedShared)).to.equal(true); // A still owns it
      expect(exists(exposedA)).to.equal(true);

      m.prune([]); // A gone too
      expect(exists(exposedShared)).to.equal(false);
      expect(exists(exposedA)).to.equal(false);
    });

    it('removes directories left empty, but never the output directory itself', function () {
      const rootERC20 = root('contracts/token/ERC20.sol');
      const exposedERC20 = exposed('contracts/token/ERC20.sol');
      write(exposedERC20);

      const m = ExposedManifest.empty(rootDir, outDir);
      m.setGenerated([rootERC20], new Map([[exposedERC20, [rootERC20]]]));
      m.prune([]);

      expect(exists(exposedERC20)).to.equal(false);
      expect(exists(exposed('contracts/token'))).to.equal(false); // emptied dirs pruned
      expect(exists(exposed('contracts'))).to.equal(false);
      expect(exists(outDir)).to.equal(true); // kept (holds manifest.json)
    });

    it('never deletes a tracked file outside the output directory', function () {
      const rootReal = root('contracts/Real.sol');
      const outsideFile = root('contracts/Real.sol'); // a real source, not under outDir
      write(outsideFile);

      const m = ExposedManifest.empty(rootDir, outDir);
      m.setGenerated([rootReal], new Map([[outsideFile, [rootReal]]]));
      m.prune([]); // would delete, but the guard refuses paths outside outDir

      expect(exists(outsideFile)).to.equal(true);
    });
  });

  describe('setGenerated', function () {
    it('drops a shared file a regenerated root no longer produces', function () {
      const rootA = root('contracts/A.sol');
      const exposedA = exposed('contracts/A.sol');
      const exposedShared = exposed('contracts/Shared.sol');
      [exposedA, exposedShared].forEach(write);

      const m = ExposedManifest.empty(rootDir, outDir);
      // Run 1: A imports Shared -> owns both.
      m.setGenerated(
        [rootA],
        new Map([
          [exposedA, [rootA]],
          [exposedShared, [rootA]],
        ]),
      );
      m.prune([rootA]);
      expect(exists(exposedShared)).to.equal(true);

      // Run 2: A no longer imports Shared -> only produces its own wrapper.
      m.setGenerated([rootA], new Map([[exposedA, [rootA]]]));
      m.prune([rootA]);

      expect(exists(exposedShared)).to.equal(false); // released by A, now orphaned
      expect(exists(exposedA)).to.equal(true);
    });
  });

  describe('hasMissingFiles', function () {
    it('is false when all tracked files exist, true once one is deleted', function () {
      const rootA = root('contracts/A.sol');
      const exposedA = exposed('contracts/A.sol');
      write(exposedA);

      const m = ExposedManifest.empty(rootDir, outDir);
      m.setGenerated([rootA], new Map([[exposedA, [rootA]]]));
      m.prune([rootA]);

      expect(m.hasMissingFiles()).to.equal(false);

      fs.rmSync(exposedA); // someone cleaned part of the output dir
      expect(m.hasMissingFiles()).to.equal(true);
    });
  });
});
