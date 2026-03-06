#!/usr/bin/env node

import cp from 'child_process';
import fs from 'fs';
import path from 'path';
import format from './format-lines.js';

function getVersion(path) {
  try {
    return fs.readFileSync(path, 'utf8').match(/\/\/ OpenZeppelin Contracts \(last updated v[^)]+\)/)[0];
  } catch {
    return null;
  }
}

async function generateFromTemplate(file, template, outputPrefix = '', lint = false) {
  const script = path.relative(path.join(import.meta.dirname, '../..'), import.meta.filename);
  const input = path.join(path.dirname(script), template);
  const output = path.join(outputPrefix, file);
  const version = getVersion(output);
  const content = format(
    '// SPDX-License-Identifier: MIT',
    ...(version ? [version + ` (${file})`] : []),
    `// This file was procedurally generated from ${input}.`,
    '',
    (await import(template)).default.trimEnd(),
  );

  fs.writeFileSync(output, content);
  lint && cp.execFileSync('prettier', ['--write', output]);
}

// Some templates needs to go through the linter after generation
const needsLinter = ['utils/structs/EnumerableMap.sol'];

// Contracts
for (const [file, template] of Object.entries({
  'utils/cryptography/MerkleProof.sol': './templates/MerkleProof.js',
  'utils/math/SafeCast.sol': './templates/SafeCast.js',
  'utils/structs/Checkpoints.sol': './templates/Checkpoints.js',
  'utils/structs/EnumerableSet.sol': './templates/EnumerableSet.js',
  'utils/structs/EnumerableMap.sol': './templates/EnumerableMap.js',
  'utils/SlotDerivation.sol': './templates/SlotDerivation.js',
  'utils/StorageSlot.sol': './templates/StorageSlot.js',
  'utils/TransientSlot.sol': './templates/TransientSlot.js',
  'utils/Arrays.sol': './templates/Arrays.js',
  'utils/Packing.sol': './templates/Packing.js',
  'mocks/StorageSlotMock.sol': './templates/StorageSlotMock.js',
  'mocks/TransientSlotMock.sol': './templates/TransientSlotMock.js',
})) {
  await generateFromTemplate(file, template, './contracts/', needsLinter.includes(file));
}

// Tests
for (const [file, template] of Object.entries({
  'utils/structs/Checkpoints.t.sol': './templates/Checkpoints.t.js',
  'utils/Packing.t.sol': './templates/Packing.t.js',
  'utils/SlotDerivation.t.sol': './templates/SlotDerivation.t.js',
})) {
  await generateFromTemplate(file, template, './test/', needsLinter.includes(file));
}
