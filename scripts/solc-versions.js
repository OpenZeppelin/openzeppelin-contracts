import { execFile } from 'child_process';
import semver from 'semver';
import { range } from './helpers.js';

// Latest version of each minor line. Releases expand to every patch of the line, prereleases only to themselves.
export const versions = ['0.4.26', '0.5.16', '0.6.12', '0.7.6', '0.8.39', '0.9.0-pre.1']
  .map(semver.parse)
  .flatMap(({ version, major, minor, patch, prerelease }) =>
    prerelease.length ? [version] : range(patch + 1).map(p => `${major}.${minor}.${p}`),
  );

// Like solc, consider that a prerelease satisfies a range if it sits within it (as lower than its release).
export const satisfies = (version, pragma) => semver.satisfies(version, pragma, { includePrerelease: true });

// Lowest known solc version accepted by a pragma.
export const minSatisfyingVersion = pragma =>
  versions
    .filter(version => satisfies(version, pragma))
    .sort(semver.compare)
    .at(0);

/**
 * Build the pragma accepting `version` and later ones (`>=`), or later ones that are semver compatible (`^`).
 * solc can't parse prerelease tags in pragmas, so prereleases are written as a range that includes them but excludes
 * the previous releases (ex: '^0.9.0-pre.1' is written '>0.8.999 <0.10.0').
 * @param {*} prefix Either '>=' or '^'.
 * @param {*} version Minimal version to accept. (ex: '0.8.20' or '0.9.0-pre.1')
 * @returns {string} The pragma. (ex: '^0.8.20' or '>0.8.999 <0.10.0')
 */
export const toPragma = (prefix, version) => {
  const { major, minor, patch, prerelease } = semver.parse(version);
  if (!prerelease.length) return `${prefix}${version}`;

  const lower =
    patch > 0 ? `>${major}.${minor}.${patch - 1}` : minor > 0 ? `>${major}.${minor - 1}.999` : `>${major - 1}.999.999`;
  const upper = major > 0 ? `<${major + 1}.0.0` : `<0.${minor + 1}.0`;
  return prefix === '^' ? `${lower} ${upper}` : lower;
};

export const compile = (source, version) =>
  new Promise((resolve, reject) =>
    execFile('forge', ['build', source, '--use', version, '--out', `out/solc-${version}`], error =>
      error ? reject(error) : resolve(),
    ),
  );
