#!/usr/bin/env node

// USAGE:
//    node fv/dependencies.js            print the dependency map of every config as JSON
//    node fv/dependencies.js --all      print the JSON array of all config files
//    node fv/dependencies.js --filter   read changed file paths on stdin, print the JSON array of
//                                       the config files affected by them
//
// The dependencies of a config are the spec files it verifies, the spec files those import, and so
// on recursively. Uses node builtins only, so it can run before `npm ci`.

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SPECS = path.join(ROOT, 'fv/specs');

// Config names come from the file listing of a pull request that may be untrusted, and end up on a
// command line downstream. Anything that is not a plain name is dropped here.
const VALID_NAME = /^[A-Za-z0-9_-]+\.conf$/;
const IMPORT = /^\s*import\s+"([^"]+)"\s*;/gm;

const relative = file => path.relative(ROOT, file).split(path.sep).join('/');

// Add `file` and every spec file it imports (recursively) to `acc`
function collect(file, acc) {
  if (acc.has(file)) return acc;
  acc.add(file);
  for (const [, target] of fs.readFileSync(file, 'utf8').matchAll(IMPORT)) {
    collect(path.resolve(path.dirname(file), target), acc);
  }
  return acc;
}

const configs = fs
  .readdirSync(SPECS)
  .filter(name => name.endsWith('.conf'))
  .filter(name => VALID_NAME.test(name) || (console.error(`Ignoring config with unexpected name: ${name}`), false))
  .map(name => path.join(SPECS, name));

const dependencies = new Map(
  configs.map(conf => {
    // `verify` is a "Contract:path/to/file.spec" entry (or a list of them) relative to the root
    const entries = [].concat(JSON.parse(fs.readFileSync(conf, 'utf8')).verify ?? []);
    const acc = new Set([conf]);
    entries.forEach(entry => collect(path.resolve(ROOT, entry.split(':').at(-1)), acc));
    return [relative(conf), Array.from(acc, relative)];
  }),
);

if (process.argv.includes('--filter')) {
  const changed = new Set(fs.readFileSync(0, 'utf8').split('\n').filter(Boolean));
  const affected = Array.from(dependencies)
    .filter(([, deps]) => deps.some(dep => changed.has(dep)))
    .map(([conf]) => conf);
  console.log(JSON.stringify(affected));
} else if (process.argv.includes('--all')) {
  console.log(JSON.stringify(Array.from(dependencies.keys())));
} else {
  console.log(JSON.stringify(Object.fromEntries(dependencies), null, 2));
}
