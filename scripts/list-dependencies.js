#!/usr/bin/env node

// Reads changed paths on stdin, prints the JSON array of files a diff reaches: the files under `--src`
// (comma separated directories) with an extension in `--ext` (comma separated) whose imports touch a
// changed file. Paths are relative to `--root` (defaults to the repository root).
//
// `--redirect` takes comma separated `from:to` pairs, rewriting resolved import paths before they are
// followed. This maps a generated tree back onto its sources, so the generation step need not have run:
//
//   node scripts/list-dependencies.js --src=fv/specs --ext=.conf --redirect=fv/patched/:contracts/
//
// lists the Certora specs affected by a change, resolving their harnesses' `../patched/` imports to `contracts/`.

import fs from 'fs';
import path from 'path';
import { memoize } from './helpers.js';

const option = name => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const ROOT = path.resolve(option('root') ?? path.join(import.meta.dirname, '..'));
const SRC = option('src')?.split(',');
const EXT = option('ext')?.split(',');
const REDIRECT =
  option('redirect')
    ?.split(',')
    .map(pair => pair.split(':')) ?? [];

if (!SRC || !EXT) {
  console.error('Missing required arguments: --src and --ext');
  process.exit(1);
}

// Import parsers for each file extension, returning the list of imported files relative to the root.
const PARSERS = new Map(
  Object.entries({
    '.conf': content => {
      const { files = [], verify = '' } = JSON.parse(content);
      return [
        // `files` entries are `path` or `path:ContractName`.
        ...files.map(entry => entry.split(':').at(0)),
        // `verify` is a single `ContractName:path`.
        verify.split(':').at(1),
      ].filter(Boolean);
    },
    '.cvl': (content, src) =>
      [...content.matchAll(/^\s*import\s+"(?<target>[^"]+)"\s*;/gm)].map(m =>
        path.join(path.dirname(src), m.groups.target),
      ),
    '.spec': (content, src) =>
      [...content.matchAll(/^\s*import\s+"(?<target>[^"]+)"\s*;/gm)].map(m =>
        path.join(path.dirname(src), m.groups.target),
      ),
    // First quoted string of a solidity import; `[^;]` stops at the statement end.
    '.sol': (content, src) =>
      [...content.matchAll(/^[ \t]*import\b[^;]*?"(?<target>[^"]+)"/gm)].map(m =>
        path.join(path.dirname(src), m.groups.target),
      ),
    default: (content, file) => {
      console.warn(`[WARNING] No parser defined for ${file}, skipping.`);
      return [];
    },
  }),
);

// Imports of `file`, or an empty list if it cannot be read or parsed. Memoized: `reachable` reaches the same file
// from many entry points, so each one is read from disk and parsed once.
const imports = memoize(file => {
  try {
    const parser = PARSERS.get(path.extname(file)) ?? PARSERS.get('default');
    return parser(fs.readFileSync(path.join(ROOT, file), 'utf8'), file);
  } catch {
    console.warn(`[WARNING] Could not resolve ${file} imports, the file may be missing or malformed.`);
    return [];
  }
});

// `file` and everything it imports, recursively.
const reachable = (file, acc = new Set()) => {
  if (!acc.has(file)) {
    acc.add(file);
    imports(file).forEach(target =>
      reachable(
        REDIRECT.reduce((target, [from, to]) => target.replace(from, to), target),
        acc,
      ),
    );
  }
  return acc;
};

const changed = new Set(fs.readFileSync(0, 'utf8').split('\n').filter(Boolean));
const affected = SRC.flatMap(dir =>
  fs
    .readdirSync(path.join(ROOT, dir), { recursive: true })
    .filter(name => fs.lstatSync(path.join(ROOT, dir, name)).isFile())
    .filter(name => EXT.includes(path.extname(name)))
    .map(name => path.join(dir, name))
    .filter(file => changed.size === 0 || reachable(file).intersection(changed).size > 0),
);

console.log(JSON.stringify(affected));
