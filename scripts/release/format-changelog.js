#!/usr/bin/env node

// Adjusts the format of the changelog that changesets generates.
// This is run automatically when npm version is run.

const fs = require('fs');
const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');

// Groups:
//  - 1: Pull Request Number and URL
//  - 2: Changeset entry
const RELEASE_LINE_REGEX = /^- (\[#.*?\]\(.*?\))?.*?! - (.*)$/gm;

// Captures vX.Y.Z or vX.Y.Z-rc.W
const VERSION_TITLE_REGEX = /^## (\d+\.\d+\.\d+(-rc\.\d+)?)$/gm;

const isPrerelease = process.env.PRERELEASE === 'true';

const formatted = changelog
  // Remove titles
  .replace(/^### Major Changes\n\n/gm, '')
  .replace(/^### Minor Changes\n\n/gm, '')
  .replace(/^### Patch Changes\n\n/gm, '')
  // Remove extra whitespace between items
  .replace(/^(- \[.*\n)\n(?=-)/gm, '$1')
  // Format each release line
  .replace(RELEASE_LINE_REGEX, (_, pr, entry) => (pr ? `- ${entry} (${pr})` : `- ${entry}`))
  // Add date to new version
  .replace(VERSION_TITLE_REGEX, `\n## $1 (${new Date().toISOString().split('T')[0]})`)
  // Conditionally allow vX.Y.Z-rc.W sections only in prerelease
  .replace(/^## \d\.\d\.\d-rc\S+[^]+?(?=^#)/gm, section => (isPrerelease ? section : ''));

fs.writeFileSync('CHANGELOG.md', formatted);
