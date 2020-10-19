#!/usr/bin/env node

// This script removes the build artifacts of ignored contracts.

const fs = require('fs');
const path = require('path');
const match = require('micromatch');

function readJSON (path) {
  return JSON.parse(fs.readFileSync(path));
}

const pkgFiles = readJSON('package.json').files;

// Get only negated patterns.
const ignorePatterns = pkgFiles
  .filter(pat => pat.startsWith('!'))
// Remove the negation part. Makes micromatch usage more intuitive.
  .map(pat => pat.slice(1));

const ignorePatternsSubtrees = ignorePatterns
// Add **/* to ignore all files contained in the directories.
  .concat(ignorePatterns.map(pat => path.join(pat, '**/*')))
  .map(p => p.replace(/^\//, ''));

const artifactsDir = 'build/contracts';

let n = 0;

for (const artifact of fs.readdirSync(artifactsDir)) {
  const fullArtifactPath = path.join(artifactsDir, artifact);
  const { sourcePath: fullSourcePath } = readJSON(fullArtifactPath);
  const sourcePath = path.relative('.', fullSourcePath);

  const ignore = match.any(sourcePath, ignorePatternsSubtrees);

  if (ignore) {
    fs.unlinkSync(fullArtifactPath);
    n += 1;
  }
}

console.error(`Removed ${n} mock artifacts`);
