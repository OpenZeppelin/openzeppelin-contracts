const { exec } = require('child_process');
const fs = require('fs');

let solcVersionsMaxPatch = ['0.5.16', '0.6.12', '0.7.6', '0.8.29'];
const allSolcVersions = solcVersionsMaxPatch.flatMap(minorVersion => {
  let patchVersions = [];
  const maxPatchVersion = parseInt(minorVersion.split('.')[2]);
  const minorVersionWithoutPatch = minorVersion.split('.').slice(0, 2).join('.');
  for (let i = 0; i <= maxPatchVersion; i++) {
    patchVersions.push(`${minorVersionWithoutPatch}.${i}`);
  }
  return patchVersions;
});

let finalizedFiles = [];

minimizeAllInterfacePragmas();

async function getApplicablePragmas(file) {
  const pragmas = await Promise.all(allSolcVersions.map(version => compileWithVersion(file, version)));
  return pragmas;
}

async function minimizePragma(file) {
  if (finalizedFiles.includes(file)) {
    return;
  }

  await updatePragmaWithDependencies(file);

  const sources = getFileSources(file);
  for (const source of sources) {
    console.log(source);
    await minimizePragma(source);
  }

  const applicablePragmas = mergePragmaLists(
    await getApplicablePragmas(file),
    await getParentApplicablePragmas(sources),
  );

  const newPragma = applicablePragmas.reduce((accumulator, currentVal) => {
    if (currentVal.success && accumulator === '') {
      return `>= ${currentVal.solcVersion}`;
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

async function compileWithVersion(file, solcVersion) {
  return new Promise(resolve => {
    exec(`forge build ${file} --ast --use ${solcVersion} --out out/out-solc${solcVersion}`, error => {
      if (error !== null) {
        return resolve({ solcVersion, success: false });
      }
      return resolve({ solcVersion, success: true });
    });
  });
}

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

function updatePragma(file, newPragma) {
  if (finalizedFiles.includes(file)) return;

  let fileContent = fs.readFileSync(file, 'utf8').split('\n');
  const pragmaLineIndex = fileContent.findIndex(line => line.startsWith('pragma solidity'));
  fileContent[pragmaLineIndex] = `pragma solidity ${newPragma};`;

  fs.writeFileSync(file, fileContent.join('\n'), 'utf8');
  console.log(`Updated pragma in ${file} to ${newPragma}`);
}

async function updatePragmaWithDependencies(file, newPragma = '>=0.5.0') {
  updatePragma(file, newPragma);

  const sources = getFileSources(file);

  for (const source of sources) {
    if (source !== file) {
      await updatePragmaWithDependencies(source, newPragma);
    }
  }
}

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
