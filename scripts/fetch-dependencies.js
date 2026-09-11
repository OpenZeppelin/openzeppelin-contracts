#!/usr/bin/env node

// USAGE:
//    node scripts/fetch-dependencies.js            print the dependency map of every entry point as JSON
//    node scripts/fetch-dependencies.js --all      print the JSON array of all entry points
//    node scripts/fetch-dependencies.js --filter   read changed file paths on stdin, print the JSON array of
//                                                  the entry points affected by them. Refuses if the change
//                                                  removes an entry point, unless --allow-removed is passed.
//    --entries=<dir>[,<dir>]                       required. Where entry points are discovered, recursively.
//    --ext=<extension>                             required. What an entry point is recognised by.
//                                                  `--entries=fv/specs --ext=.conf` maps the Certora configs,
//                                                  `--entries=contracts,contracts-exposed --ext=.sol` maps the
//                                                  contracts the test suite deploys -- both trees, because it
//                                                  deploys the generated wrappers and the contracts themselves.
//    --root=<dir>                                  the checkout to read, defaulting to the one this script
//                                                  lives in, and the only path resolved against the working
//                                                  directory: every other one is resolved against it. CI points
//                                                  it at the pull request while running this copy from the base
//                                                  branch, so what a pull request can influence is the input to
//                                                  the selection and never the code making it.
//
// The dependencies of an entry point are the files it starts from and everything those import,
// recursively: the specs reached through spec imports, the contracts reached through solidity
// imports, and the `fv/diff` patch that `make -C fv apply` applies to each of those contracts. Uses
// node builtins only, so it can run before `npm ci`.

import fs from 'fs';
import path from 'path';

const option = (name, fallback) =>
  process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3) || fallback;

const fail = message => {
  console.error(message);
  process.exit(1);
};

// `--root` is the checkout being read, resolved against the working directory. Every other path is
// resolved against it rather than against the working directory or this file, so a caller pointing
// the script at another checkout describes that checkout's layout and not its own -- which is what
// lets CI run a trusted copy of this script over a pull request.
const ROOT = path.resolve(option('root', path.resolve(import.meta.dirname, '..')));
const DIFF = path.resolve(ROOT, option('diff', 'fv/diff'));
const PATCHED = path.resolve(ROOT, option('patched', 'fv/patched'));
const EXT = option('ext', '.sol');
// Several entry directories are allowed because one tree is not always the whole answer: the gas
// report names sources from `contracts-exposed` and from `contracts`, so both have to be walked or
// the contracts deployed without a generated wrapper resolve to nothing and drop out of the report.
const ENTRIES =
  option('entries')
    ?.split(',')
    ?.map(dir => path.resolve(ROOT, dir)) ??
  fail('Missing --entries=<value>. See the usage block at the top of this file.');

// `make -C fv apply` builds `fv/patched` by copying `contracts` and applying the patches in
// `fv/diff`, each named after the file it patches with `/` written as `_` -- the same mapping the
// Makefile uses, so a name that breaks this breaks `make apply` too, loudly. Nothing outside
// `fv/patched` is affected, so this is inert for entry points that never reach it.
const unpatch = file => path.join(ROOT, 'contracts', path.relative(PATCHED, file));
const patchOf = file => path.join(DIFF, path.relative(PATCHED, file).replaceAll(path.sep, '_') + '.patch');
const relative = file => path.relative(ROOT, file).replaceAll(path.sep, '/');

// How an import is written, per file extension the walk can reach. An extension missing here is a
// file the walk does not know how to read, and reaching one is an error rather than a leaf: taking
// it for a leaf would silently drop whatever it depends on, and quietly under-report what a change
// affects.
const IMPORT = {
  '.cvl': /^\s*import\s+"(?<target>[^"]+)"\s*;/gm,
  '.spec': /^\s*import\s+"(?<target>[^"]+)"\s*;/gm,
  // A solidity import may name symbols or not, and may span several lines, so the path is taken as
  // the first string of the statement. `[^;]` stops the match at the end of the statement.
  '.sol': /^[ \t]*import\b[^;]*?"(?<target>[^"]+)"/gm,
};

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
    // Imports resolve against `file`, not `source`, so a patched file's imports stay in the patched
    // tree and anything patched further down is recorded as well.
    for (const { groups } of fs.readFileSync(source, 'utf8').matchAll(IMPORT[path.extname(source)])) {
      collect(path.resolve(path.dirname(file), groups.target), acc);
    }
  }
  return acc;
};

// Where an entry point's dependency list starts, per extension. A Certora config is not walked --
// it is JSON, not a file with imports -- so it goes in as itself, followed by the spec it verifies
// and the harnesses it declares, both named relative to the root.
const START = {
  '.conf': conf => {
    const { files, verify } = JSON.parse(fs.readFileSync(conf, 'utf8'));
    return [verify.split(':').at(-1), ...files].reduce((acc, file) => collect(path.resolve(ROOT, file), acc), [conf]);
  },
};

// Any other entry point is a source file: it is its own first dependency, and the walk does the rest
const start = file => (START[path.extname(file)] ?? (source => collect(source, [])))(file);

const dependencies = Object.fromEntries(
  ENTRIES.flatMap(entries =>
    fs
      .readdirSync(entries, { recursive: true })
      .filter(name => name.endsWith(EXT))
      // `readdirSync` returns whatever order the filesystem gives, which is not stable across
      // machines. Sort so the map is diffable and two runs of `--all` agree on the job order.
      .sort()
      .map(name => {
        const entry = path.join(entries, name);
        return [relative(entry), start(entry).map(relative)];
      }),
  ),
);

if (process.argv.includes('--filter')) {
  const changed = fs.readFileSync(0, 'utf8').split('\n').filter(Boolean);

  if (!process.argv.includes('--allow-removed')) {
    // The map above is built by listing the entry points that exist now, so one the change removes
    // is not in it, and nothing can select it. Left alone that reads as "nothing affected": removing
    // every entry point would report an empty set, run no job, and pass. Refuse instead, and make
    // dropping one something that has to be asked for.
    const removed = changed.filter(
      file =>
        ENTRIES.some(entries => file.startsWith(`${relative(entries)}/`)) &&
        file.endsWith(EXT) &&
        !Object.hasOwn(dependencies, file),
    );
    if (removed.length > 0) {
      console.error(`This change removes ${removed.join(', ')}, which cannot appear in the affected set.`);
      console.error(`Pass --allow-removed to confirm that what it selected for is meant to go away with it.`);
      process.exit(1);
    }
  }

  console.log(
    JSON.stringify(
      Object.entries(dependencies)
        .filter(([, deps]) => deps.some(dep => changed.includes(dep)))
        .map(([entry]) => entry),
    ),
  );
} else if (process.argv.includes('--all')) {
  console.log(JSON.stringify(Object.keys(dependencies)));
} else {
  console.log(JSON.stringify(dependencies, null, 2));
}
