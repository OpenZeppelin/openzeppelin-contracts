#!/usr/bin/env node

const path = require('path');
const graphlib = require('graphlib');
const match = require('micromatch');
const { findAll } = require('solidity-ast/utils');
const { _: artifacts } = require('yargs').argv;

// files to skip
const skipPatterns = ['contracts-exposed/**', 'contracts/mocks/**'];

for (const artifact of artifacts) {
  const { output: solcOutput } = require(path.resolve(__dirname, '../..', artifact));

  const graph = new graphlib.Graph({ directed: true });
  const names = {};
  const linearized = [];

  for (const source in solcOutput.contracts) {
    if (match.any(source, skipPatterns)) continue;
    for (const contractDef of findAll('ContractDefinition', solcOutput.sources[source].ast)) {
      names[contractDef.id] = contractDef.name;
      linearized.push(contractDef.linearizedBaseContracts);

      contractDef.linearizedBaseContracts.forEach((c1, i, contracts) =>
        contracts.slice(i + 1).forEach(c2 => {
          graph.setEdge(c1, c2);
        }),
      );
    }
  }

  /// graphlib.alg.findCycles will not find minimal cycles.
  /// We are only interested int cycles of lengths 2 (needs proof)
  graph.nodes().forEach((x, i, nodes) =>
    nodes
      .slice(i + 1)
      .filter(y => graph.hasEdge(x, y) && graph.hasEdge(y, x))
      .forEach(y => {
        console.log(`Conflict between ${names[x]} and ${names[y]} detected in the following dependency chains:`);
        linearized
          .filter(chain => chain.includes(parseInt(x)) && chain.includes(parseInt(y)))
          .forEach(chain => {
            const comp = chain.indexOf(parseInt(x)) < chain.indexOf(parseInt(y)) ? '>' : '<';
            console.log(`- ${names[x]} ${comp} ${names[y]} in ${names[chain.find(Boolean)]}`);
            // console.log(`- ${names[x]} ${comp} ${names[y]}: ${chain.reverse().map(id => names[id]).join(', ')}`);
          });
        process.exitCode = 1;
      }),
  );
}

if (!process.exitCode) {
  console.log('Contract ordering is consistent.');
}
