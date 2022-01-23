#!/usr/bin/env node

const path = require('path');
const proc = require('child_process');
const startCase = require('lodash.startcase');

const baseDir = process.argv[2];

const files = proc.execFileSync(
  'find', [baseDir, '-type', 'f'], { encoding: 'utf8' },
).split('\n').filter(s => s !== '');

console.log('.API');

function getPageTitle (directory) {
  if (directory === 'metatx') {
    return 'Meta Transactions';
  } else {
    return startCase(directory);
  }
}

const links = files.map((file) => {
  const doc = file.replace(baseDir, '');
  const title = path.parse(file).name;

  return {
    xref: `* xref:${doc}[${getPageTitle(title)}]`,
    title,
  };
});

// Case-insensitive sort based on titles (so 'token/ERC20' gets sorted as 'erc20')
const sortedLinks = links.sort(function (a, b) {
  return a.title.toLowerCase().localeCompare(b.title.toLowerCase(), undefined, { numeric: true });
});

for (const link of sortedLinks) {
  console.log(link.xref);
}
