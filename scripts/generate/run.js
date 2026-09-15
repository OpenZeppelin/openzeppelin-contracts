#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import prettier from 'prettier';
import { Eta } from 'eta';

// Shared data + helpers. The full set is injected into every `.sol.eta` template (e.g. it.SLOT_TYPES, it.sanitize).
import * as context from './data.js';

const repoRoot = path.join(import.meta.dirname, '../..');
const templatesDir = path.join(import.meta.dirname, 'templates');
const eta = new Eta({ views: templatesDir, autoEscape: false, autoTrim: false, defaultExtension: '' });

// Each output is rendered from `templates/<basename>.eta`.
for (const [filepath, needsPrettier] of Object.entries({
  'contracts/mocks/StorageSlotMock.sol': false,
  'contracts/mocks/TransientSlotMock.sol': false,
  'contracts/utils/Arrays.sol': false,
  'contracts/utils/Packing.sol': false,
  'contracts/utils/SlotDerivation.sol': false,
  'contracts/utils/StorageSlot.sol': false,
  'contracts/utils/TransientSlot.sol': false,
  'contracts/utils/cryptography/MerkleProof.sol': true,
  'contracts/utils/math/SafeCast.sol': false,
  'contracts/utils/structs/Checkpoints.sol': false,
  'contracts/utils/structs/EnumerableMap.sol': true,
  'contracts/utils/structs/EnumerableSet.sol': false,
  'test/utils/Packing.t.sol': false,
  'test/utils/SlotDerivation.t.sol': false,
  'test/utils/structs/Checkpoints.t.sol': false,
})) {
  console.log(`Generating ${filepath}...`);
  const template = `${path.basename(filepath)}.eta`;
  const input = path.relative(repoRoot, path.join(templatesDir, template));
  const version =
    fs.existsSync(filepath) &&
    fs.readFileSync(filepath, 'utf8').match(/^\/\/ OpenZeppelin Contracts \(last updated v[^)]+\) \([^)]+\)$/m)?.[0];
  const content = [
    '// SPDX-License-Identifier: MIT',
    ...(version ? [version] : []),
    `// This file was procedurally generated from ${input}.`,
    '',
    eta.render(template, context),
  ].join('\n');

  await (
    needsPrettier
      ? prettier
          .resolveConfig(filepath)
          .then(prettierConfig => prettier.format(content, { ...prettierConfig, filepath }))
      : Promise.resolve(content)
  ).then(formatted => {
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, formatted);
  });
}
