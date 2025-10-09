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
    default:
      return startCase(directory);
  }
}

const menuItems = files.reduce(
  (acc, file) => {
    let current = acc;
    const doc = file.replace(baseDir, '');

    const keys = doc
      .split('/')
      .filter(Boolean)
      .map(k => k.replace('.adoc', ''));

    for (let i = 0; i < keys.length; i++) {
      current = current.items[keys[i]] ??= {
        name: startCase(keys[i]),
        dir: keys[i],
        items: {},
        doc,
      };
    }

    return acc;
  },
  {
    items: {
      token: {
        name: 'tokens',
        dir: '',
        items: {},
      },
    },
  },
);

const arrayifyItems = items =>
  Object.entries(items).map(([k, v]) => {
    if (Object.keys(v.items ?? {}).length > 0) return [v, arrayifyItems(v.items)];
    return [k, v];
  });

const isString = v => typeof v === 'string';

const sortItems = items =>
  items.sort(([a], [b]) =>
    (isString(a) ? a : a.name).toLowerCase().localeCompare(isString(b) ? b : b.name, undefined, { numeric: true }),
  );

const print = (items, level = 1) => {
  items.forEach(([k, v]) => {
    if (v.doc || k?.doc)
      console.log(`${'*'.repeat(level)} xref:${v.doc || k.doc}[${getPageTitle(isString(k) ? k : k.name)}]`);
    else console.log(`${'*'.repeat(level)} ${getPageTitle(isString(k) ? k : k.name)}`);
    if (Array.isArray(v)) print(v, level + 1);
  });
};

print(
  sortItems(arrayifyItems(menuItems.items)).map(([k, v]) => {
    if (v?.length > 0) return [k, sortItems(v)];
    return [k, v];
  }),
);
