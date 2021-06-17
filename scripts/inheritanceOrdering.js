const path = require('path');
const { Graph } = require('graphlib');
const { findAll } = require('solidity-ast/utils');
const { _: artifacts } = require('yargs').argv;

for (const artifact of artifacts) {
  const { output: solcOutput } = require(path.resolve(__dirname, '..', artifact));

  const fromId = {};
  const inheritIds = {};
  for (const source in solcOutput.contracts) {
    for (const contractDef of findAll('ContractDefinition', solcOutput.sources[source].ast)) {
      fromId[contractDef.id] = contractDef.name;
      inheritIds[contractDef.name] = contractDef.linearizedBaseContracts;
    }
  }

  const chains = Object.values(inheritIds).filter(ids => ids.length > 1).map(ids => ids.map(id => fromId[id]));

  const graph = new Graph({ directed: true });
  chains.flatMap(chain => chain.flatMap((name, i, parents) => parents.slice(i + 1).map(parent => {
    graph.setNode(name);
    graph.setNode(parent);
    graph.setEdge(parent, name);
    return graph.successors(name).includes(parent) ? [name, parent] : null;
  })))
    .filter(Boolean)
    .filter((obj, i, array) => array.findIndex(obj2 => obj.join() === obj2.join()) === i)
    .forEach(([a, b]) => {
      console.log(`Conflict between ${a} and ${b} detected in the following dependency chains:`);
      chains
        .filter(chain => chain.includes(a) && chain.includes(b))
        .forEach(chain => {
          const comp = chain.indexOf(a) < chain.indexOf(b) ? '>' : '<';
          console.log(`- ${a} ${comp} ${b}: ${chain.reverse().join(', ')}`);
        });
      process.exitCode = 1;
    });
}

if (!process.exitCode) {
  console.log('Contract ordering is valid.');
}
