const { exec } = require('child_process');
const fs = require('fs');
const glob = require('glob');
const graphlib = require('graphlib');
const path = require('path');
const semver = require('semver');

const { range, unique } = require('./helpers');

const pattern = 'contracts/**/*.sol';
const exclude = ['contracts/mocks/'];

const solcVersionsMaxPatch = ['0.5.16', '0.6.12', '0.7.6', '0.8.30'];
const minVersionForContracts = '0.8.20';
const minVersionForInterfaces = '0.0.0';
const allSolcVersions = solcVersionsMaxPatch
  .map(semver.parse)
  .flatMap(({ major, minor, patch }) => range(patch + 1).map(p => `${major}.${minor}.${p}`));

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
 * Compile the given file with the specified solidity version using forge.
 * @param {*} file Absolute path to the file to compile.
 * @param {*} solcVersion Solc version to use for compilation. (ex: '0.8.4')
 * @returns {Promise<boolean>} Compilation result.
 */
const compileWithVersion = (file, solcVersion) =>
  new Promise(resolve =>
    exec(`forge build ${file} --use ${solcVersion} --out out/out-solc${solcVersion}`, error => resolve(error === null)),
  );

/**
 * Get the applicable pragmas for a given file by compiling it with all solc versions.
 * @param {*} file Absolute path to the file to compile.
 * @param {*} candidates List of solc version to test. (ex: ['0.8.4','0.8.5'])
 * @returns {Promise<string[]>} List of applicable pragmas.
 */
const getApplicablePragmas = (file, candidates = allSolcVersions) =>
  Promise.all(candidates.map(version => compileWithVersion(file, version).then(ok => (ok ? version : undefined)))).then(
    versions => versions.filter(Boolean),
  );

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

// MAIN
(async () => {
  // extract metadata for all source files
  const files = glob.sync(pattern).filter(file => exclude.every(e => path.relative(e, file).startsWith('..')));
  const metadata = Object.fromEntries(
    files.map(file => {
      // Get all objects (contracts, libraries, interfaces) defined in the file
      const items = glob.sync(`out/${path.basename(file)}/*`);
      // Get the (deduplicated) sources for each of these object. If we don't filter, we get some 'lib/forge-std' stuff we don't want.
      const sources = unique(
        items.flatMap(path => Object.keys(JSON.parse(fs.readFileSync(path)).metadata.sources)),
      ).filter(item => item !== file && files.includes(item));
      // Check if all objects are interfaces.
      const isInterface = items.every(item => path.basename(item).match(/^I[A-Z]/));

      return [file, { sources, isInterface }];
    }),
  );

  // Build dependency graph
  const graph = new graphlib.Graph({ directed: true });
  Object.keys(metadata).forEach(file => {
    graph.setNode(file);
    metadata[file].sources.forEach(dep => graph.setEdge(dep, file));
  });
  // break cycles :/
  graphlib.alg.findCycles(graph).forEach(([a, b]) => graph.removeEdge(a, b));

  // Build a topological order of the graph
  const visited = {};
  const ordered = [];
  const visit = node => {
    if (!Object.hasOwn(visited, node)) {
      visited[node] = true;
      graph.predecessors(node).forEach(visit);
      ordered.push(node);
    }
  };
  graph.sinks().forEach(visit);

  // Weaken all pragma to allow exploration
  ordered.forEach(file => updatePragma(file, '>=0.0.0'));

  // Find minimal pragma for each file
  for (const file of ordered) {
    const minVersion = metadata[file].isInterface ? minVersionForInterfaces : minVersionForContracts;
    const candidates = allSolcVersions.filter(v => semver.gte(v, minVersion));

    process.stdout.write(`Searching minimal pragma for ${file} ... `);
    const pragma = await getMinimalApplicablePragma(file, candidates);
    updatePragma(file, metadata[file].isInterface ? `>=${pragma}` : `^${pragma}`);
    console.log(pragma);
  }
})();
