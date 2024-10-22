#!/usr/bin/env node

const path = require('path');
const semver = require('semver');
const match = require('micromatch');
const { findAll } = require('solidity-ast/utils');
const { _: artifacts } = require('yargs').argv;

// files to skip
const skipPatterns = ['contracts-exposed/**', 'contracts/mocks/WithInit.sol'];

for (const artifact of artifacts) {
  const { output: solcOutput } = require(path.resolve(__dirname, '../..', artifact));

  const pragma = {};

  // Extract pragma directive for all files
  for (const source in solcOutput.contracts) {
    if (match.any(source, skipPatterns)) continue;
    for (const { literals } of findAll('PragmaDirective', solcOutput.sources[source].ast)) {
      // There should only be one.
      const [first, ...rest] = literals;
      if (first === 'solidity') pragma[source] = rest.join('');
    }
  }

  // Compare the pragma directive of the file, to that of the files it imports
  for (const source in solcOutput.contracts) {
    if (match.any(source, skipPatterns)) continue;
    // minimum version of the compiler that matches source's pragma
    const minVersion = semver.minVersion(pragma[source]);
    // loop over all imports in source
    for (const { absolutePath } of findAll('ImportDirective', solcOutput.sources[source].ast)) {
      // So files that only import without declaring anything cause issues, because they don't shop in in "pragma"
      if (!pragma[absolutePath]) continue;
      // Check that the minVersion for source satisfies the requirements of the imported files
      if (!semver.satisfies(minVersion, pragma[absolutePath])) {
        console.log(
          `- ${source} uses ${pragma[source]} but depends on ${absolutePath} that requires ${pragma[absolutePath]}`,
        );
        process.exitCode = 1;
      }
    }
  }
}

if (!process.exitCode) {
  console.log('Pragma directives are consistent.');
}
