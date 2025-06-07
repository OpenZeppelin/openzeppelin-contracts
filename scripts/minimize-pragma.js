const fs = require('fs');
const graphlib = require('graphlib');
const match = require('micromatch');
const path = require('path');
const semver = require('semver');
const { findAll } = require('solidity-ast/utils');
const { _: artifacts } = require('yargs').argv;

const { versions: allSolcVersions, compile } = require('./solc-versions');

const skipPatterns = ['contracts-exposed/**', 'contracts/mocks/**'];
const minVersionForContracts = '0.8.20';
const minVersionForInterfaces = '0.0.0';

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
    fs.readFileSync(file, 'utf8').replace(/pragma solidity [><=^]*[0-9]+.[0-9]+.[0-9]+;/, `pragma solidity ${pragma};`),
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
      compile(file, version).then(
        () => version,
        () => null,
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

const metadata = Object.fromEntries(
  artifacts.flatMap(artifact => {
    const { output: solcOutput } = require(path.resolve(__dirname, '..', artifact));
    return Object.keys(solcOutput.contracts)
      .filter(source => !match.any(source, skipPatterns))
      .map(source => [
        source,
        {
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
      const isInterface = metadata[file]?.interface ?? true;
      const minVersion = isInterface ? minVersionForInterfaces : minVersionForContracts;
      const parentsPragmas = graph
        .predecessors(file)
        .map(f => pragmas[f])
        .filter(Boolean);
      const candidates = allSolcVersions.filter(
        v => semver.gte(v, minVersion) && parentsPragmas.every(p => semver.satisfies(v, p)),
      );
      const pragmaPrefix = isInterface ? '>=' : '^';

      process.stdout.write(
        `[${Object.keys(pragmas).length + 1}/${Object.keys(metadata).length}] Searching minimal version for ${file} ... `,
      );
      const pragma = await setMinimalApplicablePragma(file, candidates, pragmaPrefix);
      console.log(pragma);

      pragmas[file] = pragma;
      queue.push(...graph.successors(file));
    }
  }
})();
