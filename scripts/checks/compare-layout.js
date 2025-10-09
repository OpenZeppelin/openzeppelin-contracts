#!/usr/bin/env node

const fs = require('fs');
const { getStorageUpgradeReport } = require('@openzeppelin/upgrades-core/dist/storage');

const { hideBin } = require('yargs/helpers');
const { argv } = require('yargs/yargs')(hideBin(process.argv))
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
