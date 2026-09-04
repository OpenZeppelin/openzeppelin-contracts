#!/usr/bin/env node

// USAGE:
//    node fv/dependencies.js            print the dependency map of every config as JSON
//    node fv/dependencies.js --all      print the JSON array of all config files
//    node fv/dependencies.js --filter   read changed file paths on stdin, print the JSON array of
//                                       the config files affected by them. Refuses if the change
//                                       removes a config, unless --allow-removed is passed.
//
// The dependencies of a config are the spec files it verifies and the harnesses it declares, plus
// everything those import, recursively: the specs reached through spec imports, the contracts
// reached through solidity imports, and the `fv/diff` patch that `make -C fv apply` applies to each
// of those contracts. Uses node builtins only, so it can run before `npm ci`.

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SPECS = path.resolve(import.meta.dirname, 'specs');

const relative = file => path.relative(ROOT, file).replaceAll(path.sep, '/');

// Config names come from the file listing of a pull request that may be untrusted, and end up on a
// command line downstream. Anything that is not a plain name is dropped here.
const VALID_NAME = /^[A-Za-z0-9_-]+\.conf$/;
const SPEC_IMPORT = /^\s*import\s+"([^"]+)"\s*;/gm;
// A solidity import may name symbols or not, and may span several lines, so the path is taken as the
// first string of the statement. `[^;]` stops the match at the end of the statement.
const SOL_IMPORT = /^[ \t]*import\b[^;]*?"([^"]+)"/gm;

// `make -C fv apply` builds `fv/patched` by copying `contracts` and applying the patches in
// `fv/diff`, each named after the file it patches with `/` written as `_` -- the same mapping the
// Makefile uses, so a name that breaks this breaks `make apply` too, loudly.
const PATCHED = path.resolve(import.meta.dirname, 'patched');
const DIFF = path.resolve(import.meta.dirname, 'diff');
const unpatch = file => path.join(ROOT, 'contracts', path.relative(PATCHED, file));
const patchOf = file => path.join(DIFF, path.relative(PATCHED, file).replaceAll(path.sep, '_') + '.patch');

// Add `file` and everything it imports (recursively) to `acc`
const collect = (file, acc) => {
  // `fv/patched` is untracked, and absent entirely until `make apply` runs, so record the contract
  // it is copied from: that file exists here, and it is the path a `git diff` reports. The patch
  // applied on the way is as much an input to the prover as the contract, so record that too.
  // Recorded whether or not the patch exists today: the entry is the slot a patch for this file
  // would occupy, so adding one, changing one and deleting one all land on a dependency. Testing
  // for existence instead would make a deleted patch match nothing, and dropping a patch changes
  // what the prover sees just as much as editing it.
  const patched = file.startsWith(PATCHED + path.sep);
  if (patched) {
    const patch = patchOf(file);
    if (!acc.includes(patch)) acc.push(patch);
  }
  const source = patched ? unpatch(file) : file;
  if (!acc.includes(source)) {
    acc.push(source);
    const pattern = source.endsWith('.sol') ? SOL_IMPORT : SPEC_IMPORT;
    // Imports resolve against `file`, not `source`, so a patched file's imports stay in the patched
    // tree and anything patched further down is recorded as well.
    for (const [, target] of fs.readFileSync(source, 'utf8').matchAll(pattern)) {
      collect(path.resolve(path.dirname(file), target), acc);
    }
  }
  return acc;
};

const configs = fs
  .readdirSync(SPECS)
  .filter(name => name.endsWith('.conf'))
  .filter(name => VALID_NAME.test(name) || (console.error(`Ignoring config with unexpected name: ${name}`), false))
  .map(name => path.join(SPECS, name));

const dependencies = Object.fromEntries(
  configs.map(conf => {
    const { files, verify } = JSON.parse(fs.readFileSync(conf, 'utf8'));
    return [
      relative(conf),
      files
        .reduce(
          (acc, file) => collect(path.resolve(ROOT, file), acc),
          collect(path.resolve(ROOT, verify.split(':').at(-1)), [conf]),
        )
        .map(relative),
    ];
  }),
);

if (process.argv.includes('--filter')) {
  const changed = fs.readFileSync(0, 'utf8').split('\n').filter(Boolean);

  // The map above is built by listing the configs that exist now, so a config the change removes is
  // not in it, and nothing can select it. Left alone that reads as "no config affected": removing
  // every config would report an empty set, run no prover job, and pass. Refuse instead, and make
  // dropping a config something that has to be asked for.
  const removed = changed.filter(
    file => file.startsWith(`${relative(SPECS)}/`) && file.endsWith('.conf') && !Object.hasOwn(dependencies, file),
  );
  if (removed.length > 0 && !process.argv.includes('--allow-removed')) {
    console.error(`This change removes ${removed.join(', ')}, which cannot appear in the affected set.`);
    console.error(`Pass --allow-removed to confirm the verification is meant to go away with it.`);
    process.exit(1);
  }

  const affected = Object.entries(dependencies)
    .filter(([, deps]) => deps.some(dep => changed.includes(dep)))
    .map(([conf]) => conf);
  console.log(JSON.stringify(affected));
} else if (process.argv.includes('--all')) {
  console.log(JSON.stringify(Object.keys(dependencies)));
} else {
  console.log(JSON.stringify(dependencies, null, 2));
}
