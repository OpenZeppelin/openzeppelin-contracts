const { exec } = require('child_process');
const semver = require('semver');
const { range } = require('./helpers');

module.exports = {
  versions: ['0.4.26', '0.5.16', '0.6.12', '0.7.6', '0.8.30']
    .map(semver.parse)
    .flatMap(({ major, minor, patch }) => range(patch + 1).map(p => `${major}.${minor}.${p}`)),
  compile: (source, version) =>
    new Promise((resolve, reject) =>
      exec(`forge build ${source} --use ${version} --out out/solc-${version}`, error =>
        error ? reject(error) : resolve(),
      ),
    ),
};
