const path = require('path');
const graphlib = require('graphlib');
const { findAll } = require('solidity-ast/utils');
const { _: artifacts } = require('yargs').argv;

for (const artifact of artifacts) {
  const { output: solcOutput } = require(path.resolve(__dirname, '..', artifact));

  const graph = new graphlib.Graph({ directed: true });
  const names = {};
  const linearized = [];

  for (const source in solcOutput.contracts) {
    for (const contractDef of findAll('ContractDefinition', solcOutput.sources[source].ast)) {
      names[contractDef.id] = contractDef.name;
      linearized.push(contractDef.linearizedBaseContracts);

      contractDef.linearizedBaseContracts.forEach((c1, i, contracts) => contracts.slice(i + 1).forEach(c2 => {
        graph.setEdge(c1, c2);
      }));
    }
  }

  graphlib.alg.findCycles(graph).forEach(([ c1, c2 ]) => {
    console.log(`Conflict between ${names[c1]} and ${names[c2]} detected in the following dependency chains:`);
    linearized
      .filter(chain => chain.includes(parseInt(c1)) && chain.includes(parseInt(c2)))
      .forEach(chain => {
        const comp = chain.indexOf(c1) < chain.indexOf(c2) ? '>' : '<';
        console.log(`- ${names[c1]} ${comp} ${names[c2]}: ${chain.reverse().map(id => names[id]).join(', ')}`);
      });
    process.exitCode = 1;
  });
}

if (!process.exitCode) {
  console.log('Contract ordering is consistent.');
}
