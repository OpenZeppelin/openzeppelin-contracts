import path from 'node:path';
import { expect } from 'chai';

import { normalizeSourcePath } from './transpile.js';

describe('hardhat-transpiler task', () => {
  describe('normalizeSourcePath', () => {
    it('converts OS-specific separators to POSIX (Windows regression)', () => {
      // What `path.relative(root, mainSources)` returns on Windows for a nested source dir.
      const windowsRelative = path.win32.relative('C:\\repo', 'C:\\repo\\src\\contracts');
      expect(windowsRelative).to.equal('src\\contracts');

      // The build-info source name is always POSIX, e.g. `src/contracts/Foo.sol`.
      // Without normalization the `startsWith(mainSourcesRel + '/')` filter drops the file.
      const sourceName = 'src/contracts/Foo.sol';
      expect(sourceName.startsWith(windowsRelative + '/')).to.equal(false);
      expect(sourceName.startsWith(normalizeSourcePath(windowsRelative) + '/')).to.equal(true);
    });

    it('leaves POSIX paths unchanged', () => {
      expect(normalizeSourcePath('contracts')).to.equal('contracts');
      expect(normalizeSourcePath('src/contracts')).to.equal('src/contracts');
    });

    it('is idempotent on already-POSIX input', () => {
      expect(normalizeSourcePath(normalizeSourcePath('src/contracts'))).to.equal('src/contracts');
    });
  });
});
