#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import proc from 'child_process';
import semver from 'semver';

const run = (cmd, ...args) => proc.execFileSync(cmd, args, { encoding: 'utf8' }).trim();

const gitStatus = run('git', 'status', '--porcelain', '-uno', 'contracts/**/*.sol');
if (gitStatus.length > 0) {
  console.error('Contracts directory is not clean');
  process.exit(1);
}

const { version } = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../../package.json'), 'utf8'));

// Get latest tag according to semver.
const [tag] = run('git', 'tag')
  .split(/\r?\n/)
  .filter(semver.coerce) // check version can be processed
  .filter(v => semver.satisfies(v, `< ${version}`)) // ignores prereleases unless currently a prerelease
  .sort(semver.rcompare);

// Ordering tag → HEAD is important here.
const files = run('git', 'diff', tag, 'HEAD', '--name-only', 'contracts/**/*.sol')
  .split(/\r?\n/)
  .filter(file => file && !file.match(/mock/i) && fs.existsSync(file));

for (const file of files) {
  const current = fs.readFileSync(file, 'utf8');
  const updated = current.replace(
    /(\/\/ SPDX-License-Identifier:.*)$(\n\/\/ OpenZeppelin Contracts .*$)?/m,
    `$1\n// OpenZeppelin Contracts (last updated v${version}) (${file.replace('contracts/', '')})`,
  );
  fs.writeFileSync(file, updated);
}
