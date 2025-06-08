#!/usr/bin/env node

// const path = require('path');
const semver = require('semver');
// const match = require('micromatch');
// const { findAll } = require('solidity-ast/utils');
// const { _: artifacts } = require('yargs').argv;

const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');

const getContractsMetadata = require('../get-contracts-metadata');
const { compile } = require('../solc-versions');

const {
  argv: { pattern, skipPatterns, verbose, _: artifacts },
} = yargs(hideBin(process.argv))
  .env('')
  .options({
    pattern: { alias: 'p', type: 'string', default: 'contracts/**/*.sol' },
    skipPatterns: { alias: 's', type: 'string', default: 'contracts/mocks/**/*.sol' },
    verbose: { alias: 'v', type: 'count' },
  });

Promise.all(
  Object.entries(getContractsMetadata(pattern, skipPatterns, artifacts)).map(([source, { pragma }]) => {
    const { version } = semver.minVersion(pragma);
    return compile(source, version).then(
      () => {
        verbose && console.log(`Compile ${source} using solc ${version}: ok`);
      },
      error => {
        console.log(`Failed to compile ${source} using solc ${version}\n${error}`);
        process.exitCode = 1;
      },
    );
  }),
).finally(() => {
  if (!process.exitCode) {
    console.log('All files can be compiled with the specified pragma.');
  }
});
