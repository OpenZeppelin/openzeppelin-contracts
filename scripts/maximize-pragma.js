const { exec } = require('child_process');
const fs = require('fs');
const { hideBin } = require('yargs/helpers');
const { argv } = require('yargs/yargs')(hideBin(process.argv)).positional('file', {
  type: 'string',
  describe: 'The contract to set pragma for',
});

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

temp('contracts/interfaces/IERC721.sol');

async function main() {
  console.log(await Promise.all(allSolcVersions.map(version => compileWithVersion(argv.file, version))));
}

async function getApplicablePragmas(file) {
  const pragmas = await Promise.all(allSolcVersions.map(version => compileWithVersion(file, version)));
  return pragmas;
}

async function temp(file) {
  const sources = getFileSources(file);

  console.log(mergePragmaLists(await getApplicablePragmas(file), await getParentApplicablePragmas(sources)));
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

async function updateAllInterfacePragmas(newPragma) {
  const dirPath = 'contracts/interfaces';
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    if (!file.endsWith('.sol')) {
      continue;
    }
    await updatePragmaWithDependencies(`${dirPath}/${file}`, newPragma);
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

async function updatePragma(file, newPragma) {
  let fileContent = fs.readFileSync(file, 'utf8').split('\n');
  const pragmaLineIndex = fileContent.findIndex(line => line.startsWith('pragma solidity'));
  fileContent[pragmaLineIndex] = `pragma solidity ${newPragma};`;

  fs.writeFileSync(file, fileContent.join('\n'), 'utf8');
  console.log(`Updated pragma in ${file}`);
}

async function updatePragmaWithDependencies(file, newPragma) {
  updatePragma(file, newPragma);

  const sources = getFileSources(file);

  for (const source of sources) {
    if (source !== file && !source.split('.').at(-1).startsWith('draft')) {
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
