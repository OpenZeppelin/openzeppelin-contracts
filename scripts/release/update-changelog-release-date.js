#!/usr/bin/env node

// Sets the release date of the current release in the changelog.
// This is run automatically when npm version is run.

const fs = require('fs');
const cp = require('child_process');

const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');

// The changelog entry to be updated looks like this:
// ## Unreleased
// We need to add the version and release date in a YYYY-MM-DD format, so that it looks like this:
// ## 2.5.3 (2019-04-25)

const unreleased = /^## Unreleased$/im;

if (!unreleased.test(changelog)) {
  console.error('Missing changelog entry');
  process.exit(1);
}

const { version } = require('../../package.json');

fs.writeFileSync('CHANGELOG.md', changelog.replace(
  unreleased,
  `## ${version} (${new Date().toISOString().split('T')[0]})`),
);

cp.execSync('git add CHANGELOG.md', { stdio: 'inherit' });
