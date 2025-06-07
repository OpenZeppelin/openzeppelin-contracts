#!/usr/bin/env node

const path = require('path');
const semver = require('semver');
const match = require('micromatch');
const { findAll } = require('solidity-ast/utils');
const { _: artifacts } = require('yargs').argv;

const { compile } = require('../solc-versions');

// files to skip
const skipPatterns = ['contracts-exposed/**', 'contracts/mocks/**'];

Promise.all(
  artifacts.flatMap(artifact => {
    const { output: solcOutput } = require(path.resolve(__dirname, '../..', artifact));
    return Object.keys(solcOutput.contracts)
      .filter(source => !match.any(source, skipPatterns))
      .map(source =>
        Promise.all(
          Array.from(findAll('PragmaDirective', solcOutput.sources[source].ast))
            .filter(ast => ast.literals.at(0) === 'solidity')
            .map(ast => {
              const version = semver.minVersion(ast.literals.slice(1).join(''));
              return compile(source, version).catch(error => {
                console.log(`Failed to compile ${source} using solc ${version}\n${error}`);
                process.exitCode = 1;
              });
            }),
        ),
      );
  }),
).finally(() => {
  if (!process.exitCode) {
    console.log('All files can be compiled with the specified pragma.');
  }
});
