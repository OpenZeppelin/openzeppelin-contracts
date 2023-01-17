const { findAll } = require('solidity-ast/utils');
const { astDereferencer } = require('@openzeppelin/upgrades-core/dist/ast-dereferencer');
const { solcInputOutputDecoder } = require('@openzeppelin/upgrades-core/dist/src-decoder');
const { extractStorageLayout } = require('@openzeppelin/upgrades-core/dist/storage/extract');
const { getStorageUpgradeReport } = require('@openzeppelin/upgrades-core/dist/storage');

const { ref, head } = require('yargs').argv;

const skipPath = ['contracts/mocks/', 'contracts-exposed/'];
const skipKind = ['interface', 'library'];

function extractLayouts(file) {
  const layout = {};
  const { input, output } = require(file);

  const decoder = solcInputOutputDecoder(input, output);
  const deref = astDereferencer(output);

  for (const src in output.contracts) {
    if (skipPath.some(prefix => src.startsWith(prefix))) {
      continue;
    }

    for (const contractDef of findAll('ContractDefinition', output.sources[src].ast)) {
      if (skipKind.includes(contractDef.contractKind)) {
        continue;
      }

      layout[contractDef.name] = extractStorageLayout(
        contractDef,
        decoder,
        deref,
        output.contracts[src][contractDef.name].storageLayout,
      );
    }
  }
  return layout;
}

const oldLayout = extractLayouts(ref);
const newLayout = extractLayouts(head);

for (const name in oldLayout) {
  if (name in newLayout) {
    const report = getStorageUpgradeReport(oldLayout[name], newLayout[name], {});
    if (!report.ok) {
      console.log(`ERROR: Storage incompatibility in ${name}`);
      console.log(report.explain());
      process.exitCode = 1;
    }
  } else {
    console.log(`WARNING: ${name} is missing from the current branch`);
  }
}
