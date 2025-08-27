const fs = require('fs');
const glob = require('glob');
const match = require('micromatch');
const path = require('path');
const { findAll } = require('solidity-ast/utils');

module.exports = function (
  pattern = 'contracts/**/*.sol',
  skipPatterns = ['contracts/mocks/**/*.sol'],
  artifacts = [],
) {
  // Use available hardhat artifacts. They reliably identify pragmas and the contracts, libraries and interfaces
  // definitions with minimal IO operations.
  const metadata = Object.fromEntries(
    artifacts.flatMap(artifact => {
      const { output: solcOutput } = require(path.resolve(__dirname, '..', artifact));
      return Object.keys(solcOutput.contracts)
        .filter(source => match.all(source, pattern) && !match.any(source, skipPatterns))
        .map(source => [
          source,
          {
            pragma: Array.from(findAll('PragmaDirective', solcOutput.sources[source].ast))
              .find(({ literals }) => literals.at(0) == 'solidity')
              .literals.slice(1)
              .join(''),
            sources: Array.from(findAll('ImportDirective', solcOutput.sources[source].ast)).map(
              ({ absolutePath }) => absolutePath,
            ),
            interface: Array.from(findAll('ContractDefinition', solcOutput.sources[source].ast)).every(
              ({ contractKind }) => contractKind === 'interface',
            ),
          },
        ]);
    }),
  );

  // Artifacts are missing files that only include imports. We have a few of these in contracts/interfaces
  // We add the missing metadata entries using the foundry artifacts
  glob
    .sync(pattern)
    .filter(file => !match.any(file, skipPatterns) && !Object.hasOwn(metadata, file))
    .forEach(file => {
      const entries = glob.sync(`out/${path.basename(file)}/*`);
      metadata[file] = {
        pragma: fs.readFileSync(file, 'utf-8').match(/pragma solidity (?<pragma>[<>=^]*[0-9]+\.[0-9]+\.[0-9]+);/)
          ?.groups.pragma,
        sources: entries
          .flatMap(entry => Object.keys(JSON.parse(fs.readFileSync(entry)).metadata.sources))
          .filter(source => source !== file && match.all(source, pattern) && !match.any(source, skipPatterns)),
        interface: entries.every(entry => path.basename(entry).match(/^I[A-Z]/)),
      };
    });

  return metadata;
};
