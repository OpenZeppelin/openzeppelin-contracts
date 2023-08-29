const fs = require('fs');
const path = require('path');
const { GlobSync } = require('glob'); // used by solhint
const parser = require('@solidity-parser/parser');

// Files matching these patterns will be ignored unless a rule has `static global = true`
const excludedDirs = ['contracts/mocks/**/*', 'test/**/*'];

const ROOT_PATH = path.resolve(__dirname, '../..');

function main() {
  const reports = processPath('contracts/**/*.sol');

  if (reports.length > 0) {
    console.log('Found duplicates in custom errors:');
    for (const report of reports) {
      let output = '';
      for (const file of report.files) {
        output += `${report.name}: declared in ${file.file}, line: ${file.node.loc.start.line}, column: ${file.node.loc.start.column}\n`;
      }
      console.log(output, '\n');
    }
  }
  exitWithCode(reports);
}

function processPath(expression) {
  const allFiles = GlobSync(expression, { nodir: true, cwd: ROOT_PATH, ignore: excludedDirs }).found;

  const filesContainingCustomError = {};

  allFiles.map(curFile => {
    const customErrors = processFile(path.resolve(ROOT_PATH, curFile));
    if (customErrors.length > 0) {
      for (const customError of customErrors) {
        if (!filesContainingCustomError[customError.name]) {
          filesContainingCustomError[customError.name] = [{ file: curFile, node: customError }];
        } else {
          filesContainingCustomError[customError.name].push({ file: curFile, node: customError });
        }
      }
    }
  });

  const duplicates = [];
  for (const customError of Object.keys(filesContainingCustomError)) {
    if (filesContainingCustomError[customError].length > 1) {
      duplicates.push({ name: customError, files: filesContainingCustomError[customError] });
    }
  }

  return duplicates;
}

function processFile(filePath) {
  const ast = parseInput(fs.readFileSync(filePath).toString());
  const customErrors = [];
  parser.visit(ast, {
    CustomErrorDefinition: node => {
      customErrors.push(node);
    },
  });
  return customErrors;
}

function parseInput(inputStr) {
  try {
    // first we try to parse the string as we normally do
    return parser.parse(inputStr, { loc: true, range: true });
  } catch (e) {
    // using 'loc' may throw when inputStr is empty or only has comments
    return parser.parse(inputStr, {});
  }
}

function exitWithCode(reports) {
  process.exit(reports.length > 0 ? 1 : 0);
}

main();
