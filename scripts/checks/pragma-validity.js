#!/usr/bin/env node

const semver = require('semver');
const pLimit = require('p-limit').default;

const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');

const getContractsMetadata = require('../get-contracts-metadata');
const { compile } = require('../solc-versions');

const {
  argv: { pattern, skipPatterns, verbose, concurrency, _: artifacts },
} = yargs(hideBin(process.argv))
  .env('')
  .options({
    pattern: { alias: 'p', type: 'string', default: 'contracts/**/*.sol' },
    skipPatterns: { alias: 's', type: 'string', default: 'contracts/mocks/**/*.sol' },
    concurrency: { alias: 'c', type: 'number', default: 8 },
    verbose: { alias: 'v', type: 'count' },
  });

const limit = pLimit(concurrency);
Promise.all(
  Object.entries(getContractsMetadata(pattern, skipPatterns, artifacts)).map(([source, { pragma }]) =>
    limit(
      (file, version) =>
        compile(file, version).then(
          () => {
            verbose && console.log(`Compile ${file} using solc ${version}: ok`);
          },
          error => {
            console.error(`Failed to compile ${file} using solc ${version}\n${error}`);
            process.exitCode = 1;
          },
        ),
      source,
      semver.minVersion(pragma),
    ),
  ),
).finally(() => {
  if (!process.exitCode) {
    console.log('All files can be compiled with the specified pragma.');
  }
});
