#!/usr/bin/env node

// Sets the release date of the current release in the changelog.
// This is run automatically when npm version is run.

const fs = require('fs');
const cp = require('child_process');

const pkg = require('../../package.json');
if (pkg.version.indexOf('-rc') !== -1) {
  process.exit(0);
}

const version = pkg.version.replace(/-.*/, ''); // Remove the rc suffix

const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');

// The changelog entry to be updated looks like this:
// ## 2.5.3 (unreleased)
// We need to add the date in a YYYY-MM-DD format, so that it looks like this:
// ## 2.5.3 (2019-04-25)

if (changelog.indexOf(`## ${version} (unreleased)`) === -1) {
  throw Error(`Found no changelog entry for version ${version}`);
}

fs.writeFileSync('CHANGELOG.md', changelog.replace(
  `## ${version} (unreleased)`,
  `## ${version} (${new Date().toISOString().split('T')[0]})`)
);

cp.execSync('git add CHANGELOG.md', { stdio: 'inherit' });
