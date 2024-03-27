const path = require('path');
const { findAll } = require('solidity-ast/utils');
const { _: artifacts } = require('yargs').argv;

const excludedDirs = ['contracts/mocks/', 'test/', 'contracts-exposed'];
const ROOT_PATH = path.resolve(__dirname, '../..');

function main() {
  const reports = processArtifacts(artifacts);

  if (reports.length > 0) {
    console.log('Found duplicates in custom errors:');
    for (const report of reports) {
      let output = '';
      for (const file of report.files) {
        output += `${report.name}: declared in ${file.file}\n`;
      }
      console.log(output, '\n');
    }
  }

  if (reports.length > 0) process.exitCode = 1;

  if (!process.exitCode) {
    console.log('No duplicate custom errors found.');
  }
}

function processArtifacts(artifacts) {
  const filesContainingCustomError = {};

  for (const artifact of artifacts) {
    const { output: solcOutput } = require(path.resolve(ROOT_PATH, artifact));

    for (const source in solcOutput.contracts) {
      if (excludedDirs.some(pattern => source.startsWith(pattern))) {
        continue;
      }

      const customErrors = processSource(source, solcOutput);
      if (customErrors.length > 0) {
        for (const customError of customErrors) {
          if (!filesContainingCustomError[customError.name]) {
            filesContainingCustomError[customError.name] = [{ file: source, node: customError }];
          } else {
            filesContainingCustomError[customError.name].push({ file: source, node: customError });
          }
        }
      }
    }
  }

  const duplicates = [];
  for (const customError of Object.keys(filesContainingCustomError)) {
    if (filesContainingCustomError[customError].length > 1) {
      duplicates.push({ name: customError, files: filesContainingCustomError[customError] });
    }
  }

  return duplicates;
}

function processSource(source, solcOutput) {
  const customErrors = [];
  for (const customError of findAll('ErrorDefinition', solcOutput.sources[source].ast)) {
    customErrors.push(customError);
  }
  return customErrors;
}

main();
