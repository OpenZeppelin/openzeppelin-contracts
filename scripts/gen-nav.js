#!/usr/bin/env node

const path = require('path');
const glob = require('glob');
const startCase = require('lodash.startcase');

const baseDir = process.argv[2];

const files = glob.sync(baseDir + '/**/*.adoc').map(f => path.relative(baseDir, f));

console.log('.API');

function getPageTitle(directory) {
  switch (directory) {
    case 'metatx':
      return 'Meta Transactions';
    case 'common':
      return 'Common (Tokens)';
    default:
      return startCase(directory);
  }
}

const links = files.map(file => {
  const doc = file.replace(baseDir, '');
  const title = path.parse(file).name;

  const level = doc.split('/').length;

  return `${'*'.repeat(level)} xref:${doc}[${getPageTitle(title)}]`;
});

// Case-insensitive sort based on xref (so 'token/ERC20' gets sorted as 'token/erc20')
const sortedLinks = links.sort(function (a, b) {
  return a.toLowerCase().localeCompare(b.toLowerCase(), undefined, { numeric: true });
});

for (const link of sortedLinks) {
  console.log(link);
}
