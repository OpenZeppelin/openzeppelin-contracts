#!/usr/bin/env node

// Sets the changelog output to the format used in this repo.
// It also includes adding date to the new release
// This is run automatically when npm version is run.

const fs = require('fs');
const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');

const PR_NUMBER = `\\[#(\\d+)\\]`;
const REPO = '[A-z|-]+';
const GITHUB_USERNAME = `(?:[A-z\\d](?:[A-z\\d]|-(?=[A-z\\d])){0,38})`;
const GITHUB_URL = `https://github\\.com/`;
const REPO_URL = `${GITHUB_URL}${GITHUB_USERNAME}/${REPO}/`;
const SHORT_SHA = '[0-9a-f]{7}';
const FULL_SHA = '[0-9a-f]{40}';

// Groups:
//  - 1: Pull Request Number
//  - 2: Pull Request URL
//  - 3: Changeset entry
const RELEASE_LINE_REGEX = new RegExp(
  `- (?:${PR_NUMBER}\\((${REPO_URL}pull/\\d+)\\) )?\\[\`${SHORT_SHA}\`\\]\\(${REPO_URL}commit/${FULL_SHA}\\) Thanks \\[@${GITHUB_USERNAME}\\]\\(${GITHUB_URL}(?:apps/)?${GITHUB_USERNAME}\\)! - (.*)`,
  'g',
);

// Captures vX.Y.Z or vX.Y.Z-rc.W
const VERSION_TITLE_REGEX = /\n## (\d\.\d\.\d(-rc\.\d)?)\n/g;

const formatted = changelog
  // Remove extra \n
  .replace(/\n- (\[.*)/g, '- $1')
  // Format each release line
  .replace(RELEASE_LINE_REGEX, (_, PRNumber, PRUrl, title) => {
    const replaced = `- ${title}`;
    if (PRNumber && PRUrl) return `${replaced} ([#${PRNumber}](${PRUrl}))`;
    return replaced;
  })
  // Add date to new version
  .replace(VERSION_TITLE_REGEX, `\n## $1 (${new Date().toISOString().split('T')[0]})\n\n`)
  // Remove titles
  .replace(/\n### Major Changes\n/g, '')
  .replace(/\n### Minor Changes\n/g, '')
  .replace(/\n### Patch Changes\n/g, '');

fs.writeFileSync('CHANGELOG.md', formatted);
