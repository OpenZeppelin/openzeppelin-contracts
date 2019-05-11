#!/usr/bin/env node

// This script removes the build artifacts of ignored contracts.

const fs = require('fs');
const path = require('path');
const proc = require('child_process');

function exec(cmd, ...args) {
  proc.execFileSync(cmd, args, { stdio: 'inherit' });
}

exec('npm', 'run', 'compile');

const ignoredPaths = [
  path.resolve('contracts/mocks'),
  path.resolve('contracts/examples'),
];

const artifactsDir = 'build/contracts';

for (const artifact of fs.readdirSync(artifactsDir)) {
  const fullArtifactPath = path.join(artifactsDir, artifact);
  const { sourcePath } = JSON.parse(fs.readFileSync(fullArtifactPath));
  const ignore = ignoredPaths.find(p => sourcePath.startsWith(p));

  if (ignore) {
    fs.unlinkSync(fullArtifactPath);
  }
}
