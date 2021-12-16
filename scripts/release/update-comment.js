const fs = require('fs');
const proc = require('child_process');
const semver = require('semver');

const { version } = require('../../package.json');

const status = proc.execFileSync('git', ['status', '--porcelain', '-uno', 'contracts/**/*.sol']);
if (status.length > 0) {
  console.error('Contracts directory is not clean');
  process.exit(1);
}

const [ tag ] = proc.execFileSync('git', ['tag'])
  .toString()
  .split(/\r?\n/)
  .filter(v => semver.valid(v) && semver.lte(v, version))
  .sort(semver.rcompare);

// Ordering tag → HEAD is important here.
// Is it right to use HEAD ?
const diffs = proc.execFileSync('git', ['diff', tag, 'HEAD', '--name-only'])
  .toString()
  .split(/\r?\n/)
  .filter(path => path.startsWith('contracts/'))
  .filter(path => !path.startsWith('contracts/mocks'))
  .filter(path => path.endsWith('.sol'));

for (const file of diffs) {
  const current = fs.readFileSync(file, 'utf8');
  const updated = current.replace(
    /(\/\/ SPDX-License-Identifier:.*)$(\n\/\/ OpenZeppelin Contracts v.*$)?/m,
    `$1\n// Last updated in OpenZeppelin Contracts v${version} (${file.replace('contracts/', '')})`,
  );
  fs.writeFileSync(file, updated);
}

proc.execFileSync('git', ['add', '--update', 'contracts']);
