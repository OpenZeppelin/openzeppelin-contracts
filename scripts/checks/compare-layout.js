const fs = require('fs');
const { getStorageUpgradeReport } = require('@openzeppelin/upgrades-core/dist/storage');

const { ref, head } = require('yargs').argv;

const oldLayout = JSON.parse(fs.readFileSync(ref));
const newLayout = JSON.parse(fs.readFileSync(head));

for (const name in oldLayout) {
  if (name in newLayout) {
    const report = getStorageUpgradeReport(oldLayout[name], newLayout[name], {});
    if (!report.ok) {
      console.log(report.explain());
      process.exitCode = 1;
    }
  } else {
    console.log(`WARNING: ${name} is missing from the current branch`);
  }
}
