#!/usr/bin/env node

import fs from 'fs';
import { getStorageUpgradeReport } from '@openzeppelin/upgrades-core/dist/storage/index.js';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const { argv } = yargs(hideBin(process.argv))
  .env('')
  .options({
    ref: { type: 'string', required: true },
    head: { type: 'string', required: true },
  });

const oldLayout = JSON.parse(fs.readFileSync(argv.ref));
const newLayout = JSON.parse(fs.readFileSync(argv.head));

for (const name in oldLayout) {
  if (name in newLayout) {
    const report = getStorageUpgradeReport(oldLayout[name], newLayout[name], {});
    if (!report.ok) {
      console.log(`Storage layout incompatibility found in ${name}:`);
      console.log(report.explain());
      process.exitCode = 1;
    }
  } else {
    console.log(`WARNING: ${name} is missing from the current branch`);
  }
}
