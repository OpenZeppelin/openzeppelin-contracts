#!/usr/bin/env node

// Reads changed paths on stdin, prints the JSON array of contracts a diff reaches: the `.sol` under
// `contracts` and `contracts-exposed` whose imports touch a changed file. Filters the gas comparison.

import fs from 'fs';
import path from 'path';

const ROOT = path.join(import.meta.dirname, '..');
const SRCS = ['contracts', 'contracts-exposed'];
const PATTERNS = new Map([
  // First quoted string of a solidity import; `[^;]` stops at the statement end.
  ['.sol', /^[ \t]*import\b[^;]*?"(?<target>[^"]+)"/gm],
]);

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
const affected = SRCS.flatMap(dir =>
  fs
    .readdirSync(path.join(ROOT, dir), { recursive: true })
    .filter(name => fs.lstatSync(path.join(ROOT, dir, name)).isFile() && PATTERNS.has(path.extname(name)))
    .map(name => path.join(dir, name))
    .filter(file => changed.size === 0 || reachable(file).intersection(changed).size > 0),
);

console.log(JSON.stringify(affected));
