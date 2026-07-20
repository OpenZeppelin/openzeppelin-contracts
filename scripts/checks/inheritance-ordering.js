#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import graphlib from 'graphlib';
import match from 'micromatch';
import { findAll } from 'solidity-ast/utils.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const { _: artifacts } = yargs(hideBin(process.argv)).argv;

// only consider files in the package: take pattern from package.json
const { files: patterns } = JSON.parse(
  fs.readFileSync(path.resolve(import.meta.dirname, '../../', 'package.json'), 'utf-8'),
);

for (const artifact of artifacts) {
  const { output: solcOutput } = JSON.parse(
    fs.readFileSync(path.resolve(import.meta.dirname, '../..', artifact), 'utf-8'),
  );

  const graph = new graphlib.Graph({ directed: true });
  const names = {};
  const linearized = [];

  // Rebuild solcOutput?.sources by removing the "project" prefix from the keys, so that we can match them against the patterns in package.json
  const sources = Object.fromEntries(
    Object.entries(solcOutput?.sources ?? {}).map(([key, value]) => [key.replace(/^project\//, ''), value]),
  );

  // For each source file that matches the patterns ...
  for (const file of match(Object.keys(sources), patterns)) {
    // ... find all ContractDefinition in this file ...
    for (const contractDef of findAll('ContractDefinition', sources[file].ast)) {
      // ... record the details for that contracts ...
      names[contractDef.id] = contractDef.name;
      linearized.push(contractDef.linearizedBaseContracts);
      // ... and add edges to the graph for each pair of contracts in the linearized base contracts.
      contractDef.linearizedBaseContracts.forEach((c1, i, contracts) =>
        contracts.slice(i + 1).forEach(c2 => {
          graph.setEdge(c1, c2);
        }),
      );
    }
  }

  /// graphlib.alg.findCycles will not find minimal cycles.
  /// We are only interested in cycles of lengths 2 (needs proof)
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
