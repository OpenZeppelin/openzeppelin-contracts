#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import prettier from 'prettier';
import { Eta } from 'eta';

// Shared data + helpers injected into the `.sol.eta` templates.
import * as context from './data.js';

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

// output path (relative to the prefix) -> template context
for (const [prefix, entries] of Object.entries({
  contracts: [
    'mocks/StorageSlotMock.sol',
    'mocks/TransientSlotMock.sol',
    'utils/Arrays.sol',
    'utils/Packing.sol',
    'utils/SlotDerivation.sol',
    'utils/StorageSlot.sol',
    'utils/TransientSlot.sol',
    'utils/cryptography/MerkleProof.sol',
    'utils/math/SafeCast.sol',
    'utils/structs/Checkpoints.sol',
    'utils/structs/EnumerableMap.sol',
    'utils/structs/EnumerableSet.sol',
  ],
  test: ['utils/Packing.t.sol', 'utils/SlotDerivation.t.sol', 'utils/structs/Checkpoints.t.sol'],
})) {
  for (const file of entries) {
    console.log(`Generating ${path.join(prefix, file)}...`);
    const template = `${path.basename(file)}.eta`;
    const input = path.relative(repoRoot, path.join(templatesDir, template));
    const output = path.join(prefix, file);
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
}
