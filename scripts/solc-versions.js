import { execFile } from 'child_process';
import semver from 'semver';
import { range } from './helpers.js';

// Latest version of each minor line. Releases expand to every patch of the line, prereleases only to themselves.
export const versions = ['0.4.26', '0.5.16', '0.6.12', '0.7.6', '0.8.39', '0.9.0-pre.1']
  .map(semver.parse)
  .flatMap(({ version, major, minor, patch, prerelease }) =>
    prerelease.length ? [version] : range(patch + 1).map(p => `${major}.${minor}.${p}`),
  );

export const compile = (source, version) =>
  new Promise((resolve, reject) =>
    execFile('forge', ['build', source, '--use', version, '--out', `out/solc-${version}`], error =>
      error ? reject(error) : resolve(),
    ),
  );
