#!/usr/bin/env node

const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const format = require('./format-lines');

function getVersion(path) {
  try {
    return fs.readFileSync(path, 'utf8').match(/\/\/ OpenZeppelin Contracts \(last updated v[^)]+\)/)[0];
  } catch (err) {
    return null;
  }
}

function generateFromTemplate(file, template, outputPrefix = '') {
  const script = path.relative(path.join(__dirname, '../..'), __filename);
  const input = path.join(path.dirname(script), template);
  const output = path.join(outputPrefix, file);
  const version = getVersion(output);
  const content = format(
    '// SPDX-License-Identifier: MIT',
    ...(version ? [version + ` (${file})`] : []),
    `// This file was procedurally generated from ${input}.`,
    '',
    require(template),
  );

  fs.writeFileSync(output, content);
  cp.execFileSync('prettier', ['--write', output]);
}

// Contracts
for (const [file, template] of Object.entries({
  'utils/math/SafeCast.sol': './templates/SafeCast.js',
  'utils/structs/EnumerableSet.sol': './templates/EnumerableSet.js',
  'utils/structs/EnumerableMap.sol': './templates/EnumerableMap.js',
  'utils/Checkpoints.sol': './templates/Checkpoints.js',
  'utils/StorageSlot.sol': './templates/StorageSlot.js',
})) {
  generateFromTemplate(file, template, './contracts/');
}

// Tests
for (const [file, template] of Object.entries({
  'utils/Checkpoints.t.sol': './templates/Checkpoints.t.js',
})) {
  generateFromTemplate(file, template, './test/');
}
