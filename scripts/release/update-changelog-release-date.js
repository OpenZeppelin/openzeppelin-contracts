#!/usr/bin/env node

// Sets the release date of the current release in the changelog.
// This is run automatically when npm version is run.

const fs = require('fs');
const cp = require('child_process');

const suffix = process.env.PRERELEASE_SUFFIX || 'rc';

const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');

// The changelog entry to be updated looks like this:
// ## Unreleased
// We need to add the version and release date in a YYYY-MM-DD format, so that it looks like this:
// ## 2.5.3 (2019-04-25)

const pkg = require('../../package.json');
const version = pkg.version.replace(new RegExp('-' + suffix + '\\..*'), '');

const unreleased = /^## Unreleased$/im;
const released = new RegExp(`^## ${version} \\([-\\d]*\\)$`, 'm');

if (released.test(changelog)) {
  process.exit(0);
}

if (!unreleased.test(changelog)) {
  console.error('Missing changelog entry');
  process.exit(1);
}

fs.writeFileSync('CHANGELOG.md', changelog.replace(
  unreleased,
  `## ${version} (${new Date().toISOString().split('T')[0]})`),
);

cp.execSync('git add CHANGELOG.md', { stdio: 'inherit' });
