const { findAll } = require('solidity-ast/utils');
const { astDereferencer } = require('@openzeppelin/upgrades-core/dist/ast-dereferencer');
const { solcInputOutputDecoder } = require('@openzeppelin/upgrades-core/dist/src-decoder');
const { extractStorageLayout } = require('@openzeppelin/upgrades-core/dist/storage/extract');
const { StorageLayoutComparator } = require('@openzeppelin/upgrades-core/dist/storage/compare');
const { LayoutCompatibilityReport } = require('@openzeppelin/upgrades-core/dist/storage/report');

const { ref, head } = require('yargs').argv;

function extractLayouts (file) {
  const layout = {};
  const { input, output } = require(file);

  const decoder = solcInputOutputDecoder(input, output);
  const deref = astDereferencer(output);

  for (const src in output.contracts) {
    if (src.startsWith('contracts/mocks/')) {
      continue;
    }

    for (const contractDef of findAll('ContractDefinition', output.sources[src].ast)) {
      if ([ 'interface', 'library' ].includes(contractDef.contractKind)) {
        continue;
      }

      layout[contractDef.name] = extractStorageLayout(
        contractDef,
        decoder,
        deref,
        output.contracts[src][contractDef.name].storageLayout,
      ).storage;
    }
  }
  return layout;
}

const oldLayout = extractLayouts(ref);
const newLayout = extractLayouts(head);

for (const id in oldLayout) {
  if (id in newLayout) {
    const comparator = new StorageLayoutComparator();
    const report = new LayoutCompatibilityReport(comparator.layoutLevenshtein(
      oldLayout[id],
      newLayout[id],
      { allowAppend: false },
    ));
    if (!report.ok) {
      console.log(`ERROR: Storage incompatibility in ${id}`);
      console.log(report.explain());
      process.exitCode = 1;
    }
  } else {
    console.log(`WARNING: ${id} is missing from the current branch`);
  }
}
