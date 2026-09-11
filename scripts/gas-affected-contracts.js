#!/usr/bin/env node

// Reads changed paths on stdin, prints the JSON array of contracts a diff reaches: the `.sol` under
// `contracts` and `contracts-exposed` whose imports touch a changed file. Filters the gas comparison.

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const repoPath = file => path.relative(ROOT, file);

// First quoted string of a solidity import; `[^;]` stops at the statement end.
const IMPORT = /^[ \t]*import\b[^;]*?"(?<target>[^"]+)"/gm;

// `file` and everything it imports, recursively.
const reachable = (file, acc = []) => {
  if (!acc.includes(file)) {
    acc.push(file);
    for (const { groups } of fs.readFileSync(file, 'utf8').matchAll(IMPORT)) {
      reachable(path.resolve(path.dirname(file), groups.target), acc);
    }
  }
  return acc;
};

const changed = fs.readFileSync(0, 'utf8').split('\n').filter(Boolean);

const affected = ['contracts', 'contracts-exposed'].flatMap(dir =>
  fs
    .readdirSync(path.resolve(ROOT, dir), { recursive: true })
    .filter(name => name.endsWith('.sol'))
    .map(name => path.resolve(ROOT, dir, name))
    .filter(entry => reachable(entry).some(dep => changed.includes(repoPath(dep))))
    .map(repoPath),
);

console.log(JSON.stringify(affected.sort()));
