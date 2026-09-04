#!/usr/bin/env node

// USAGE:
//    node fv/dependencies.js            print the dependency map of every config as JSON
//    node fv/dependencies.js --all      print the JSON array of all config files
//    node fv/dependencies.js --filter   read changed file paths on stdin, print the JSON array of
//                                       the config files affected by them
//
// The dependencies of a config are the spec files it verifies and the harnesses it declares, plus
// everything those import, recursively: the specs reached through spec imports, and the contracts
// reached through solidity imports. Uses node builtins only, so it can run before `npm ci`.

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SPECS = path.resolve(import.meta.dirname, 'specs');

// Config names come from the file listing of a pull request that may be untrusted, and end up on a
// command line downstream. Anything that is not a plain name is dropped here.
const VALID_NAME = /^[A-Za-z0-9_-]+\.conf$/;
const SPEC_IMPORT = /^\s*import\s+"([^"]+)"\s*;/gm;
// A solidity import may name symbols or not, and may span several lines, so the path is taken as the
// first string of the statement. `[^;]` stops the match at the end of the statement.
const SOL_IMPORT = /^[ \t]*import\b[^;]*?"([^"]+)"/gm;

// `fv/patched` is a copy of `contracts` produced by `make -C fv apply`. It is untracked, and absent
// entirely until that runs, so a dependency on it is recorded against the contract it is copied
// from: that file exists here, and it is the path a `git diff` reports.
const PATCHED = path.resolve(import.meta.dirname, 'patched');
const unpatch = file =>
  file.startsWith(PATCHED + path.sep) ? path.join(ROOT, 'contracts', path.relative(PATCHED, file)) : file;

const relative = file => path.relative(ROOT, file).split(path.sep).join('/');

// Add `file` and everything it imports (recursively) to `acc`
const collect = (file, acc) => {
  if (!acc.includes(file)) {
    acc.push(file);
    const pattern = file.endsWith('.sol') ? SOL_IMPORT : SPEC_IMPORT;
    for (const [, target] of fs.readFileSync(file, 'utf8').matchAll(pattern)) {
      collect(unpatch(path.resolve(path.dirname(file), target)), acc);
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
  const changed = new Set(fs.readFileSync(0, 'utf8').split('\n').filter(Boolean));
  const affected = Object.entries(dependencies)
    .filter(([, deps]) => deps.some(dep => changed.has(dep)))
    .map(([conf]) => conf);
  console.log(JSON.stringify(affected));
} else if (process.argv.includes('--all')) {
  console.log(JSON.stringify(Object.keys(dependencies)));
} else {
  console.log(JSON.stringify(dependencies, null, 2));
}
