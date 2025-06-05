#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const semver = require('semver');
const match = require('micromatch');
const { findAll } = require('solidity-ast/utils');
const { _: artifacts } = require('yargs').argv;

// files to skip
const skipPatterns = ['contracts-exposed/**', 'contracts/mocks/**'];

Promise.all(
  artifacts.flatMap(artifact => {
    const { output: solcOutput } = require(path.resolve(__dirname, '../..', artifact));
    return Object.keys(solcOutput.contracts)
      .filter(source => !match.any(source, skipPatterns))
      .map(
        source =>
          new Promise((resolve, reject) => {
            const [
              {
                literals: [first, ...rest],
              },
            ] = findAll('PragmaDirective', solcOutput.sources[source].ast);
            if (first === 'solidity') {
              const { version } = semver.minVersion(rest.join(''));
              exec(`forge build ${source} --use ${version} --out out/out-solc${version}`, error => {
                if (error) {
                  console.log(`Failed to compile ${source} using solc ${version}\n${error}`);
                  process.exitCode = 1;
                  resolve();
                }
              });
            } else reject();
          }),
      );
  }),
).finally(() => {
  if (!process.exitCode) {
    console.log('All files can be compiler with the specified pragma.');
  }
});
