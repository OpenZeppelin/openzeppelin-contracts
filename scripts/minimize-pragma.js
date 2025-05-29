const { exec } = require('child_process');
const fs = require('fs');

let solcVersionsMaxPatch = ['0.5.16', '0.6.12', '0.7.6', '0.8.29'];

// Generate an array of all the solc versions.
const allSolcVersions = solcVersionsMaxPatch.flatMap(minorVersion => {
  let patchVersions = [];
  const maxPatchVersion = parseInt(minorVersion.split('.')[2]);
  const minorVersionWithoutPatch = minorVersion.split('.').slice(0, 2).join('.');
  for (let i = 0; i <= maxPatchVersion; i++) {
    patchVersions.push(`${minorVersionWithoutPatch}.${i}`);
  }
  return patchVersions;
});

// Files that have been finalized and should not be modified again.
let finalizedFiles = [];

minimizeAllInterfacePragmas();

/**
 * Main entry point that minimizes the pragma for all interface files. Draft interfaces are ignored.
 */
async function minimizeAllInterfacePragmas() {
  const dirPath = 'contracts/interfaces';
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    if (!file.endsWith('.sol') || file.startsWith('draft')) {
      continue;
    }
    await minimizePragma(`${dirPath}/${file}`);
  }
}

/**
 * Minimize the pragma for a give file and all its dependencies.
 * @param {*} file Absolute path to the file to minimize.
 */
async function minimizePragma(file) {
  if (finalizedFiles.includes(file)) {
    return;
  }

  console.log(`Minimizing pragma in ${file}`);

  await updatePragmaWithDependencies(file);

  const sources = getFileSources(file);
  for (const source of sources) {
    await minimizePragma(source);
  }

  const applicablePragmas = mergePragmaLists(
    await getApplicablePragmas(file),
    await getParentApplicablePragmas(sources),
  );

  const newPragma = applicablePragmas.reduce((accumulator, currentVal) => {
    if (currentVal.success && accumulator === '') {
      return `>=${currentVal.solcVersion}`;
    }

    if (!currentVal.success && accumulator !== '') {
      throw new Error('Unexpected failing compilation');
    }
    return accumulator;
  }, '');

  updatePragma(file, newPragma);

  console.log(`Finalized pragma in ${file} to ${newPragma}`);
  finalizedFiles.push(file);
}

/**
 * Get the applicable pragmas for a given file by compiling it with all solc versions.
 */
async function getApplicablePragmas(file) {
  const pragmas = await Promise.all(allSolcVersions.map(version => compileWithVersion(file, version)));
  return pragmas;
}

/**
 * Get the applicable pragmas for all parents of a given file. Each parent's applicability is merged.
 * @param {*} parents
 * @returns An array of applicable pragmas for all parents.
 */
async function getParentApplicablePragmas(parents) {
  let pragmas;
  for (const parent of parents) {
    if (pragmas === undefined) {
      pragmas = await getApplicablePragmas(parent);
    } else {
      pragmas = mergePragmaLists(pragmas, await getApplicablePragmas(parent));
    }
  }
  return pragmas;
}

/**
 * Compile the given file with the specified solidity version using forge.
 * @param {*} file Absolute path to the file to compile.
 * @param {*} solcVersion Solc version to use for compilation. (ex: 0.8.4)
 * @returns {Promise<{solcVersion: string, success: boolean}>} Compilation result.
 */
async function compileWithVersion(file, solcVersion) {
  return new Promise(resolve => {
    exec(`forge build ${file} --use ${solcVersion} --out out/out-solc${solcVersion}`, error => {
      if (error !== null) {
        return resolve({ solcVersion, success: false });
      }
      return resolve({ solcVersion, success: true });
    });
  });
}

/**
 * Gets the sources of a given file from the AST output. Note, must already be compiled with AST.
 * @param {*} file Absolute path to the file to get sources from.
 * @returns An array of sources for the file excluding the file itself.
 */
function getFileSources(file) {
  const contractName = file.split('/').at(-1);

  const jsonOutput = JSON.parse(fs.readFileSync(`out/${contractName}/${contractName.split('.')[0]}.json`));
  if (jsonOutput.metadata === undefined || jsonOutput.metadata.sources === undefined) {
    return [];
  }

  const sources = Object.keys(
    JSON.parse(fs.readFileSync(`out/${contractName}/${contractName.split('.')[0]}.json`)).metadata.sources,
  );
  return sources.filter(source => source !== file);
}

/**
 * Updates the pragma in the given file to the newPragma version.
 * @param {*} file Absolute path to the file to update.
 * @param {*} newPragma New pragma version to set. (ex: >=0.8.4)
 */
function updatePragma(file, newPragma) {
  if (finalizedFiles.includes(file)) return;

  let fileContent = fs.readFileSync(file, 'utf8').split('\n');
  const pragmaLineIndex = fileContent.findIndex(line => line.startsWith('pragma solidity'));
  fileContent[pragmaLineIndex] = `pragma solidity ${newPragma};`;

  fs.writeFileSync(file, fileContent.join('\n'), 'utf8');
  console.log(`Updated pragma in ${file} to ${newPragma}`);
}

/**
 * Updates the pragma in the given file and all its dependencies to the newPragma version.
 * This is a recursive function that will update all dependencies of the file.
 * @param {*} file Absolute path to the file to update.
 * @param {*} newPragma New pragma version to set. (ex: >=0.8.4). Defaults to >=0.5.0.
 */
async function updatePragmaWithDependencies(file, newPragma = '>=0.5.0') {
  updatePragma(file, newPragma);

  const sources = getFileSources(file);

  for (const source of sources) {
    if (source !== file) {
      await updatePragmaWithDependencies(source, newPragma);
    }
  }
}

/**
 * Merge two lists of pragma compatibility results.
 */
function mergePragmaLists(pragmaList1, pragmaList2) {
  if (pragmaList1 === undefined || pragmaList2 === undefined) return pragmaList1 ?? pragmaList2;

  let res = [];

  const versions = pragmaList1.map(item => item.solcVersion);
  for (const version of versions) {
    const success1 = pragmaList1.find(item => item.solcVersion === version)?.success;
    const success2 = pragmaList2.find(item => item.solcVersion === version)?.success;
    res.push({ solcVersion: version, success: (success1 ?? false) && (success2 ?? false) });
  }

  return res;
}
