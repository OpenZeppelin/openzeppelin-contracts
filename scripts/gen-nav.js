#!/usr/bin/env node

const path = require('path');
const proc = require('child_process');
const startCase = require('lodash.startcase');

const baseDir = process.argv[2];

const files = proc.execFileSync(
  'find', [baseDir, '-type', 'f'], { encoding: 'utf8' }
).split('\n').filter(s => s !== '');

console.log('.API');

for (const file of files) {
  const doc = file.replace(baseDir, '');
  const title = path.parse(file).name;
  console.log(`* xref:${doc}[${startCase(title)}]`);
}
