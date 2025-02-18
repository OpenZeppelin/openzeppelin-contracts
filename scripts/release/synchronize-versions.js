#!/usr/bin/env node

// Synchronizes the version in contracts/package.json with the one in package.json.
// This is run automatically when npm version is run.

const fs = require('fs');

setVersion('package.json', 'contracts/package.json');

function setVersion(from, to) {
  const fromJson = JSON.parse(fs.readFileSync(from));
  const toJson = JSON.parse(fs.readFileSync(to));
  toJson.version = fromJson.version;
  fs.writeFileSync(to, JSON.stringify(toJson, null, 2) + '\n');
}
