#!/usr/bin/env node

// const cp = require('child_process');
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
    require(template).trimEnd(),
  );

  fs.writeFileSync(output, content);
  // cp.execFileSync('prettier', ['--write', output]);
}

// Contracts
for (const [file, template] of Object.entries({
  'utils/math/SafeCast.sol': './templates/SafeCast.js',
  'utils/structs/EnumerableSet.sol': './templates/EnumerableSet.js',
  'utils/structs/EnumerableMap.sol': './templates/EnumerableMap.js',
  'utils/structs/Checkpoints.sol': './templates/Checkpoints.js',
  'utils/SlotDerivation.sol': './templates/SlotDerivation.js',
  'utils/StorageSlot.sol': './templates/StorageSlot.js',
  'utils/Arrays.sol': './templates/Arrays.js',
  'utils/Packing.sol': './templates/Packing.js',
  'mocks/StorageSlotMock.sol': './templates/StorageSlotMock.js',
})) {
  generateFromTemplate(file, template, './contracts/');
}

// Tests
for (const [file, template] of Object.entries({
  'utils/structs/Checkpoints.t.sol': './templates/Checkpoints.t.js',
  'utils/Packing.t.sol': './templates/Packing.t.js',
  'utils/SlotDerivation.t.sol': './templates/SlotDerivation.t.js',
})) {
  generateFromTemplate(file, template, './test/');
}
