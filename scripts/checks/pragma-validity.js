const { exec } = require('child_process');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const semver = require('semver');

const pattern = 'contracts/**/*.sol';
const exclude = ['contracts/mocks/'];

Promise.all(
  glob
    .sync(pattern)
    .filter(file => exclude.every(e => path.relative(e, file).startsWith('..')))
    .map(
      file =>
        new Promise((resolve, reject) => {
          const { version } = semver.minVersion(
            fs.readFileSync(file, 'utf8').match(/pragma solidity (?<pragma>[><=^]*[0-9]+.[0-9]+.[0-9]+);/)?.groups
              .pragma,
          );
          return exec(`forge build ${file} --use ${version} --out out/out-solc${version}`, error =>
            error === null ? resolve() : reject(`Failed to compile ${file} using solc ${version}\n${error}`),
          );
        }),
    ),
).catch(error => {
  console.error(error);
  process.exit(1);
});
