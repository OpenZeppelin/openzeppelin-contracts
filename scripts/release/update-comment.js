const fs = require('fs');
const proc = require('child_process');
const semver = require('semver');

const gitStatus = proc.execFileSync('git', ['status', '--porcelain', '-uno', 'contracts/**/*.sol']);
if (gitStatus.length > 0) {
  console.error('Contracts directory is not clean');
  process.exit(1);
}

const { version } = require('../../package.json');

const [ tag ] = proc.execFileSync('git', ['tag'])
  .toString()
  .split(/\r?\n/)
  .filter(v => semver.valid(v) && semver.lte(v, version))
  .sort(semver.rcompare);

// Ordering tag → HEAD is important here.
// Is it right to use HEAD ?
const files = proc.execFileSync('git', ['diff', tag, 'HEAD', '--name-only', 'contracts/**/*.sol'])
  .toString()
  .split(/\r?\n/)
  .filter(Boolean)
  .filter(file => !file.match(/mock/i));

for (const file of files) {
  const current = fs.readFileSync(file, 'utf8');
  const updated = current.replace(
    /(\/\/ SPDX-License-Identifier:.*)$(\n\/\/ OpenZeppelin Contracts v.*$)?/m,
    `$1\n// Last updated in OpenZeppelin Contracts v${version} (${file.replace('contracts/', '')})`,
  );
  fs.writeFileSync(file, updated);
}

proc.execFileSync('git', ['add', '--update', 'contracts']);
