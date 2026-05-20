import fs from 'fs';
import { findAll, astDereferencer, srcDecoder } from 'solidity-ast/utils.js';
import { extractStorageLayout } from '@openzeppelin/upgrades-core/dist/storage/extract.js';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const { _: artifacts } = yargs(hideBin(process.argv)).argv;
const inputArtifacts = artifacts.filter(p => !p.endsWith('.output.json'));

const skipPath = ['contracts/mocks/', 'contracts-exposed/'];
const skipKind = ['interface', 'library'];

function extractLayouts(path) {
  const layout = {};
  const { input } = JSON.parse(fs.readFileSync(path));
  const outputPath = path.replace(/\.json$/, '.output.json');
  const { output } = JSON.parse(fs.readFileSync(outputPath));

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

console.log(JSON.stringify(Object.assign({}, ...inputArtifacts.map(extractLayouts))));
