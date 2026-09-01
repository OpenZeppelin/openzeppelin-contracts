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
for (const filepath of [
  'contracts/mocks/StorageSlotMock.sol',
  'contracts/mocks/TransientSlotMock.sol',
  'contracts/utils/Arrays.sol',
  'contracts/utils/Packing.sol',
  'contracts/utils/SlotDerivation.sol',
  'contracts/utils/StorageSlot.sol',
  'contracts/utils/TransientSlot.sol',
  'contracts/utils/cryptography/MerkleProof.sol',
  'contracts/utils/math/SafeCast.sol',
  'contracts/utils/structs/Checkpoints.sol',
  'contracts/utils/structs/EnumerableMap.sol',
  'contracts/utils/structs/EnumerableSet.sol',
  'test/utils/Packing.t.sol',
  'test/utils/SlotDerivation.t.sol',
  'test/utils/structs/Checkpoints.t.sol',
]) {
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

  // Output whitespace/indentation is canonicalized by prettier (via the repo config), not the template.
  await prettier
    .resolveConfig(filepath)
    .then(prettierConfig => prettier.format(content, { ...prettierConfig, filepath }))
    .then(formatted => {
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
      fs.writeFileSync(filepath, formatted);
    });
}
