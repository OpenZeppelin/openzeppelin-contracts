const fs = require('fs');
const { findAll, astDereferencer, srcDecoder } = require('solidity-ast/utils');
const { extractStorageLayout } = require('@openzeppelin/upgrades-core/dist/storage/extract');

const { _ } = require('yargs').argv;

const skipPath = ['contracts/mocks/', 'contracts-exposed/'];
const skipKind = ['interface', 'library'];

function extractLayouts(path) {
  const layout = {};
  const { input, output } = JSON.parse(fs.readFileSync(path));

  const decoder = srcDecoder(input, output);
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

console.log(JSON.stringify(Object.assign(..._.map(extractLayouts))));
