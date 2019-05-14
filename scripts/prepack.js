#!/usr/bin/env node

// This script removes the build artifacts of ignored contracts.

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const match = require('micromatch');

function exec (cmd, ...args) {
  cp.execFileSync(cmd, args, { stdio: 'inherit' });
}

function readJSON (path) {
  return JSON.parse(fs.readFileSync(path));
}

exec('npm', 'run', 'compile');

const pkgFiles = readJSON('package.json').files;

// Get only negated patterns.
const ignorePatterns = pkgFiles
  .filter(pat => pat.startsWith('!'))
// Add **/* to ignore all files contained in the directories.
  .flatMap(pat => [pat, path.join(pat, '**/*')])
// Remove the negation part. Makes micromatch usage more intuitive.
  .map(pat => pat.slice(1));

const artifactsDir = 'build/contracts';

for (const artifact of fs.readdirSync(artifactsDir)) {
  const fullArtifactPath = path.join(artifactsDir, artifact);
  const { sourcePath: fullSourcePath } = readJSON(fullArtifactPath);
  const sourcePath = path.relative('.', fullSourcePath);

  const ignore = match.any(sourcePath, ignorePatterns);

  if (ignore) {
    fs.unlinkSync(fullArtifactPath);
  }
}
