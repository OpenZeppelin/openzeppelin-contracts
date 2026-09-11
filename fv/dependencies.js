#!/usr/bin/env node

// Prints, as a JSON array, the Certora configs a diff affects -- so CI runs only those. A config's
// dependencies are the spec it verifies, the harnesses it declares, everything those import
// (`.spec`/`.cvl`/`.sol`), and the `fv/diff` patch `make -C fv apply` applies to each contract.
//
//   --all             print every config, ignoring stdin
//   (default)         read changed paths on stdin, print the configs they affect
//   --allow-removed   don't refuse when the diff removes a config
//   --root=<dir>      checkout to read (default: this script's). CI runs the base-branch copy with
//                     --root=<PR tree>, so a PR feeds the selection but never the code making it.

import fs from 'fs';
import path from 'path';

const rootArg = process.argv.find(arg => arg.startsWith('--root='))?.slice(7);
const ROOT = path.resolve(rootArg ?? path.resolve(import.meta.dirname, '..'));
const DIFF = path.resolve(ROOT, 'fv/diff');
const PATCHED = path.resolve(ROOT, 'fv/patched');
const SPECS = path.resolve(ROOT, 'fv/specs');

// `make -C fv apply` builds fv/patched from contracts/ plus the fv/diff patches (named with `/` as `_`).
const unpatch = file => path.join(ROOT, 'contracts', path.relative(PATCHED, file));
const patchOf = file => path.join(DIFF, path.relative(PATCHED, file).replaceAll('/', '_') + '.patch');
const repoPath = file => path.relative(ROOT, file);

// Import path syntax per extension a config can reach.
const IMPORT = {
  '.cvl': /^\s*import\s+"(?<target>[^"]+)"\s*;/gm,
  '.spec': /^\s*import\s+"(?<target>[^"]+)"\s*;/gm,
  '.sol': /^[ \t]*import\b[^;]*?"(?<target>[^"]+)"/gm,
};

// `file` and everything it imports, recursively.
const reachable = (file, acc = []) => {
  // fv/patched is untracked (absent until `make apply`): record the tracked contract it copies and the
  // patch slot -- recorded whether or not the patch exists yet, since adding, editing or deleting one
  // all change what the prover sees. Imports resolve against `file` so they stay in the patched tree.
  const patched = file.startsWith(PATCHED + '/');
  if (patched) {
    const patch = patchOf(file);
    if (!acc.includes(patch)) acc.push(patch);
  }
  const source = patched ? unpatch(file) : file;
  if (!acc.includes(source)) {
    acc.push(source);
    for (const { groups } of fs.readFileSync(source, 'utf8').matchAll(IMPORT[path.extname(source)])) {
      reachable(path.resolve(path.dirname(file), groups.target), acc);
    }
  }
  return acc;
};

const dependencies = Object.fromEntries(
  fs
    .readdirSync(SPECS)
    .filter(name => name.endsWith('.conf'))
    .map(name => {
      const conf = path.join(SPECS, name);
      const { files, verify } = JSON.parse(fs.readFileSync(conf, 'utf8'));
      const deps = files.reduce(
        (acc, file) => reachable(path.resolve(ROOT, file), acc),
        reachable(path.resolve(ROOT, verify.split(':').at(-1)), [conf]),
      );
      return [repoPath(conf), deps.map(repoPath)];
    }),
);

if (process.argv.includes('--all')) {
  console.log(JSON.stringify(Object.keys(dependencies)));
} else {
  const changed = fs.readFileSync(0, 'utf8').split('\n').filter(Boolean);

  // A config the diff removes isn't in the map, so it would select nothing and pass silently. Refuse
  // unless asked, so dropping a verification is a deliberate, reviewed choice.
  if (!process.argv.includes('--allow-removed')) {
    const removed = changed.filter(
      f => f.startsWith(`${repoPath(SPECS)}/`) && f.endsWith('.conf') && !Object.hasOwn(dependencies, f),
    );
    if (removed.length > 0) {
      console.error(`This change removes ${removed.join(', ')}; pass --allow-removed to confirm.`);
      process.exit(1);
    }
  }

  console.log(
    JSON.stringify(
      Object.entries(dependencies)
        .filter(([, deps]) => deps.some(dep => changed.includes(dep)))
        .map(([conf]) => conf),
    ),
  );
}
