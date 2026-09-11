#!/usr/bin/env node

// Reads changed paths on stdin, prints the JSON array of files a diff reaches: the files under `--src`
// (comma separated directories) with an extension in `--ext` (comma separated) whose imports touch a
// changed file. Paths are relative to `--root` (defaults to the repository root). Filters the gas comparison.

import fs from 'fs';
import path from 'path';

const PATTERNS = new Map(
  Object.entries({
    // First quoted string of a solidity import; `[^;]` stops at the statement end.
    '.sol': /^[ \t]*import\b[^;]*?"(?<target>[^"]+)"/gm,
  }),
);

const option = name => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const ROOT = path.resolve(option('root') ?? path.join(import.meta.dirname, '..'));
const SRC = option('src')?.split(',');
const EXT = option('ext')?.split(',');

if (!SRC || !EXT) {
  console.error('Missing required arguments: --src and --ext');
  process.exit(1);
}

// `file` and everything it imports, recursively.
const reachable = (file, acc = new Set()) => {
  if (!acc.has(file)) {
    acc.add(file);
    try {
      for (const { groups } of fs
        .readFileSync(path.join(ROOT, file), 'utf8')
        .matchAll(PATTERNS.get(path.extname(file)))) {
        reachable(path.join(path.dirname(file), groups.target), acc);
      }
    } catch {
      console.warn(
        `[WARNING] Could not resolve ${file} imports, either the file does not exist or no rule is defined for its extension.`,
      );
    }
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
