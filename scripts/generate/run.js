#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import prettier from 'prettier';
import { Eta } from 'eta';

// Shared data + helpers injected into the `.sol.eta` templates.
import * as sanitize from './helpers/sanitize.js';
import { capitalize, product } from '../helpers.js';
import { toBytes32, fromBytes32 } from './helpers/conversion.js';
import {
  SLOT_TYPES,
  SLOT_VALUE_TYPES,
  SET_TYPES,
  MAP_TYPES,
  CHECKPOINTS_OPTS,
  PACKING_SIZES,
  ARRAYS_TYPES,
  ARRAYS_VALUE_TYPES,
  ARRAYS_CAST_TYPES,
  ARRAYS_SORT_TYPES,
  ARRAYS_COMPARATOR_TYPES,
  SAFECAST_LENGTHS,
  MERKLEPROOF_OPTS,
  MERKLEPROOF_DEFAULT_HASH,
} from './data.js';

const args = (...parts) => parts.filter(Boolean).join(', ');
const repoRoot = path.join(import.meta.dirname, '../..');
const templatesDir = path.join(import.meta.dirname, 'templates');
const eta = new Eta({ views: templatesDir, autoEscape: false, autoTrim: false, defaultExtension: '' });
// The repo prettier config is the same for every (`.sol`) output; resolve it once.
// A `.sol` path is required so the config's `*.sol` override (e.g. double quotes) is applied.
const prettierConfig = await prettier.resolveConfig(path.join(repoRoot, 'contracts/_.sol'));

function getVersion(file) {
  try {
    return fs.readFileSync(file, 'utf8').match(/\/\/ OpenZeppelin Contracts \(last updated v[^)]+\)/)[0];
  } catch {
    return null;
  }
}

// Each output `dir/Name.sol` is generated from `templates/Name.sol.eta` with the given context.
async function generate(file, context, outputPrefix) {
  const template = `${path.basename(file)}.eta`;
  const input = path.relative(repoRoot, path.join(templatesDir, template));
  const output = path.join(outputPrefix, file);
  const version = getVersion(output);
  const content =
    [
      '// SPDX-License-Identifier: MIT',
      ...(version ? [`${version} (${file})`] : []),
      `// This file was procedurally generated from ${input}.`,
      '',
      eta.render(template, context).trimEnd(),
    ].join('\n') + '\n';

  fs.mkdirSync(path.dirname(output), { recursive: true });
  // Output whitespace/indentation is canonicalized by prettier (via the repo config), not the template.
  fs.writeFileSync(output, await prettier.format(content, { ...prettierConfig, filepath: output }));
}

// output path (relative to the prefix) -> template context
const contracts = {
  'mocks/StorageSlotMock.sol': { TYPES: SLOT_TYPES, VALUE_TYPES: SLOT_VALUE_TYPES },
  'mocks/TransientSlotMock.sol': { TYPES: SLOT_TYPES, VALUE_TYPES: SLOT_VALUE_TYPES },
  'utils/Arrays.sol': {
    TYPES: ARRAYS_TYPES,
    VALUE_TYPES: ARRAYS_VALUE_TYPES,
    CAST_TYPES: ARRAYS_CAST_TYPES,
    SORT_TYPES: ARRAYS_SORT_TYPES,
    COMPARATOR_TYPES: ARRAYS_COMPARATOR_TYPES,
    capitalize,
  },
  'utils/Packing.sol': { SIZES: PACKING_SIZES, sanitize, product },
  'utils/SlotDerivation.sol': { TYPES: SLOT_TYPES, sanitize },
  'utils/StorageSlot.sol': { TYPES: SLOT_TYPES },
  'utils/TransientSlot.sol': { TYPES: SLOT_TYPES, VALUE_TYPES: SLOT_VALUE_TYPES },
  'utils/cryptography/MerkleProof.sol': { OPTS: MERKLEPROOF_OPTS, DEFAULT_HASH: MERKLEPROOF_DEFAULT_HASH, args },
  'utils/math/SafeCast.sol': { LENGTHS: SAFECAST_LENGTHS },
  'utils/structs/Checkpoints.sol': { OPTS: CHECKPOINTS_OPTS },
  'utils/structs/EnumerableMap.sol': { MAP_TYPES, toBytes32, fromBytes32 },
  'utils/structs/EnumerableSet.sol': { SET_TYPES, toBytes32, fromBytes32 },
};

const tests = {
  'utils/Packing.t.sol': { SIZES: PACKING_SIZES, product },
  'utils/SlotDerivation.t.sol': { TYPES: SLOT_TYPES, capitalize },
  'utils/structs/Checkpoints.t.sol': { OPTS: CHECKPOINTS_OPTS, capitalize },
};

for (const [prefix, entries] of Object.entries({ './contracts/': contracts, './test/': tests })) {
  for (const [file, context] of Object.entries(entries)) {
    await generate(file, context, prefix);
  }
}
