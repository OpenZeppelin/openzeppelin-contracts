import { exec } from 'child_process';
import semver from 'semver';
import { range } from './helpers.js';

export const versions = ['0.4.26', '0.5.16', '0.6.12', '0.7.6', '0.8.33']
  .map(semver.parse)
  .flatMap(({ major, minor, patch }) => range(patch + 1).map(p => `${major}.${minor}.${p}`));

export const compile = (source, version) =>
  new Promise((resolve, reject) =>
    exec(`forge build ${source} --use ${version} --out out/solc-${version}`, error =>
      error ? reject(error) : resolve(),
    ),
  );
