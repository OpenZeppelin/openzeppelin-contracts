#!/usr/bin/env node

const fs = require('fs');
const graphlib = require('graphlib');
const semver = require('semver');
const pLimit = require('p-limit').default;
const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');

const getContractsMetadata = require('./get-contracts-metadata');
const { versions: allSolcVersions, compile } = require('./solc-versions');

const {
  argv: { pattern, skipPatterns, minVersionForContracts, minVersionForInterfaces, concurrency, _: artifacts },
} = yargs(hideBin(process.argv))
  .env('')
  .options({
    pattern: { alias: 'p', type: 'string', default: 'contracts/**/*.sol' },
    skipPatterns: { alias: 's', type: 'string', default: 'contracts/mocks/**/*.sol' },
    minVersionForContracts: { type: 'string', default: '0.8.20' },
    minVersionForInterfaces: { type: 'string', default: '0.0.0' },
    concurrency: { alias: 'c', type: 'number', default: 8 },
  });

// limit concurrency
const limit = pLimit(concurrency);

/********************************************************************************************************************
 *                                                     HELPERS                                                      *
 ********************************************************************************************************************/

/**
 * Updates the pragma in the given file to the newPragma version.
 * @param {*} file Absolute path to the file to update.
 * @param {*} pragma New pragma version to set. (ex: '>=0.8.4')
 */
const updatePragma = (file, pragma) =>
  fs.writeFileSync(
    file,
    fs
      .readFileSync(file, 'utf8')
      .replace(/pragma solidity [><=^]*[0-9]+\.[0-9]+\.[0-9]+;/, `pragma solidity ${pragma};`),
    'utf8',
  );

/**
 * Get the applicable pragmas for a given file by compiling it with all solc versions.
 * @param {*} file Absolute path to the file to compile.
 * @param {*} candidates List of solc version to test. (ex: ['0.8.4','0.8.5'])
 * @returns {Promise<string[]>} List of applicable pragmas.
 */
const getApplicablePragmas = (file, candidates = allSolcVersions) =>
  Promise.all(
    candidates.map(version =>
      limit(() =>
        compile(file, version).then(
          () => version,
          () => null,
        ),
      ),
    ),
  ).then(versions => versions.filter(Boolean));

/**
 * Get the minimum applicable pragmas for a given file.
 * @param {*} file Absolute path to the file to compile.
 * @param {*} candidates List of solc version to test. (ex: ['0.8.4','0.8.5'])
 * @returns {Promise<string>} Smallest applicable pragma out of the list.
 */
const getMinimalApplicablePragma = (file, candidates = allSolcVersions) =>
  getApplicablePragmas(file, candidates).then(valid => {
    if (valid.length == 0) {
      throw new Error(`No valid pragma found for ${file}`);
    } else {
      return valid.sort(semver.compare).at(0);
    }
  });

/**
 * Get the minimum applicable pragmas for a given file, and update the file to use it.
 * @param {*} file Absolute path to the file to compile.
 * @param {*} candidates List of solc version to test. (ex: ['0.8.4','0.8.5'])
 * @param {*} prefix Prefix to use when building the pragma (ex: '^')
 * @returns {Promise<string>} Version that was used and set in the file
 */
const setMinimalApplicablePragma = (file, candidates = allSolcVersions, prefix = '>=') =>
  getMinimalApplicablePragma(file, candidates)
    .then(version => `${prefix}${version}`)
    .then(pragma => {
      updatePragma(file, pragma);
      return pragma;
    });

/********************************************************************************************************************
 *                                                       MAIN                                                       *
 ********************************************************************************************************************/

// Build metadata from artifact files (hardhat compilation)
const metadata = getContractsMetadata(pattern, skipPatterns, artifacts);

// Build dependency graph
const graph = new graphlib.Graph({ directed: true });
Object.keys(metadata).forEach(file => {
  graph.setNode(file);
  metadata[file].sources.forEach(dep => graph.setEdge(dep, file));
});

// Weaken all pragma to allow exploration
Object.keys(metadata).forEach(file => updatePragma(file, '>=0.0.0'));

// Do a topological traversal of the dependency graph, minimizing pragma for each file we encounter
(async () => {
  const queue = graph.sources();
  const pragmas = {};
  while (queue.length) {
    const file = queue.shift();
    if (!Object.hasOwn(pragmas, file)) {
      if (Object.hasOwn(metadata, file)) {
        const minVersion = metadata[file].interface ? minVersionForInterfaces : minVersionForContracts;
        const parentsPragmas = graph
          .predecessors(file)
          .map(file => pragmas[file])
          .filter(Boolean);
        const candidates = allSolcVersions.filter(
          v => semver.gte(v, minVersion) && parentsPragmas.every(p => semver.satisfies(v, p)),
        );
        const pragmaPrefix = metadata[file].interface ? '>=' : '^';

        process.stdout.write(
          `[${Object.keys(pragmas).length + 1}/${Object.keys(metadata).length}] Searching minimal version for ${file} ... `,
        );
        const pragma = await setMinimalApplicablePragma(file, candidates, pragmaPrefix);
        console.log(pragma);

        pragmas[file] = pragma;
      }
      queue.push(...graph.successors(file));
    }
  }
})();
