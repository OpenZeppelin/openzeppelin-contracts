import assert from 'node:assert';
import path from 'node:path';

import { findAlreadyInitializable } from '@openzeppelin/upgrade-safe-transpiler/dist/find-already-initializable.js';
import type { OutputFile } from '@openzeppelin/upgrade-safe-transpiler/dist/index.js';

import type { TranspileOptions } from './transpile.ts';

/**
 * Transpiling a project that builds on contracts it does not own.
 *
 * Enabled by the `upgradeablePackages` option, which maps the import prefixes of the dependencies whose stateful
 * contracts have an upgradeable variant in another package (e.g. `{ "@openzeppelin/contracts/":
 * "@openzeppelin/contracts-upgradeable/" }`).
 *
 * Dependency sources are kept in the transpilation so that their symbols can be resolved, but their transpiled output
 * is discarded. Imports in the transpiled files are rewritten so that stateful contracts are imported from the
 * upgradeable package, and stateless declarations (interfaces, libraries, ...) from their original location. In this
 * mode, `peerProject` is required and is prepended to the source name of local files (e.g. `@openzeppelin/community-`
 * for `contracts/` to be imported from `@openzeppelin/community-contracts/`), and `initializablePath` is an import
 * path (e.g. `@openzeppelin/contracts/proxy/utils/Initializable.sol`).
 */

// Remove the `project/` prefix that Hardhat 3 adds to the source names of local files.
const stripProject = (sourceName: string) => sourceName.replace(/^project\//, '');

// Find the entry of `mapping` whose key is the longest prefix of `str`, and replace that prefix with the value.
function replacePrefix(str: string, mapping: [string, string][]): string {
  const match = mapping.toSorted(([a], [b]) => b.length - a.length).find(([from]) => str.startsWith(from));
  return match ? match[1] + str.slice(match[0].length) : str;
}

// Placeholder for the peer project. It lets imports from the peer project be identified and resolved once the
// transpilation is done.
const PEER_PLACEHOLDER = '__peer__';

/**
 * Adjusts the compiler output in place, and returns what the task must apply around the transpilation: the contracts
 * that already inherit from `Initializable`, the transpiler options to override, and the post-processing of the
 * transpiled files.
 */
export function prepareDependencies(input: any, output: any, options: TranspileOptions, mainSourcesRel: string) {
  const isLocal = (file: string) => file.startsWith(mainSourcesRel + '/');

  // Import paths are resolved to source names (and back) using the remappings of the project's root.
  const remappings: [string, string][] = (input.settings.remappings ?? [])
    .map((r: string) => r.match(/^([^:]*):([^=]*)=(.*)$/)!)
    .filter(([, context]: string[]) => context === 'project/')
    .map(([, , prefix, target]: string[]) => [prefix, stripProject(target)]);

  const toSourceName = (importPath: string) => replacePrefix(importPath, remappings);
  const toImportPath = (sourceName: string) =>
    replacePrefix(
      sourceName,
      remappings.map(([prefix, target]) => [target, prefix]),
    );

  // Unlike the source units, the import directives refer to source names that still include the `project/` prefix.
  // Transpiling with a peer project also requires every import to list its symbols. Dependencies are only transpiled
  // for their symbols to be resolved, and their output is discarded, so their unaliased imports are expanded to every
  // exported symbol.
  for (const { ast } of Object.values(output.sources) as any[]) {
    for (const node of ast.nodes) {
      if (node.nodeType !== 'ImportDirective') continue;
      node.absolutePath = stripProject(node.absolutePath);
      if (!isLocal(ast.absolutePath) && node.symbolAliases.length === 0 && node.unitAlias === '') {
        const { exportedSymbols } = output.sources[stripProject(node.absolutePath)].ast;
        node.symbolAliases = Object.keys(exportedSymbols).map(name => ({ foreign: { name }, local: null }));
      }
    }
  }

  // Contracts that already inherit from `Initializable` are left untouched. The transpiler would exclude them from the
  // transformation, but dependencies must stay included for their symbols to be resolved. Instead, only local files
  // are excluded, and `initializablePath` is not given to the transpiler. The transpiler then imports `Initializable`
  // from its default location in the peer project, which is redirected to `initializablePath`.
  const alreadyInitializable: string[] = findAlreadyInitializable(
    output,
    options.initializablePath && toSourceName(options.initializablePath),
  );

  // Maps an import path produced by the transpiler to its final location.
  const resolveImport = (file: string, importPath: string): string => {
    if (importPath === path.join(PEER_PLACEHOLDER, mainSourcesRel, 'Initializable.sol') && options.initializablePath) {
      return options.initializablePath;
    } else if (importPath.startsWith(PEER_PLACEHOLDER + '/')) {
      const sourceName = importPath.slice(PEER_PLACEHOLDER.length + 1);
      return isLocal(sourceName) ? options.peerProject! + sourceName : toImportPath(sourceName);
    } else if (importPath.startsWith('.')) {
      return importPath;
    } else {
      assert(
        Object.keys(options.upgradeablePackages ?? {}).some(prefix => importPath.startsWith(prefix)),
        `${file} imports a stateful contract from ${importPath}, which has no upgradeable variant`,
      );
      return replacePrefix(importPath, Object.entries(options.upgradeablePackages ?? {}));
    }
  };

  const withInitPath = path.join(mainSourcesRel, 'mocks', 'WithInit.sol');

  return {
    alreadyInitializable,

    // `initializablePath` and `upgradeablePackages` are handled here and must not reach the transpiler.
    optionsOverride: {
      initializablePath: undefined,
      upgradeablePackages: undefined,
      exclude: [...(options.exclude ?? []), ...alreadyInitializable.filter(isLocal)],
      peerProject: PEER_PLACEHOLDER + '/',
    } satisfies Partial<TranspileOptions>,

    // Only keep the output for the main sources, and rewrite its imports.
    postProcess: (files: OutputFile[]): OutputFile[] =>
      files
        .filter(t => isLocal(t.path))
        .map(t => ({
          ...t,
          source:
            t.path === withInitPath
              ? filterWithInit(t.path, t.source, isLocal)
              : t.source.replace(/^(import\s[^;]*?["'])([^"']+)(["'];)/gm, (_, pre, importPath, post) =>
                  [pre, resolveImport(t.path, importPath), post].join(''),
                ),
        })),
  };
}

// The generated `WithInit` file contains a block for every transformed contract, including those from dependencies.
// Only the blocks corresponding to local contracts are kept. Their imports are restricted to the contract and the
// user-defined types of its constructor arguments, to avoid clashes between symbols the imported files bring into
// scope.
const ELEMENTARY_TYPES = /^(address|bool|string|bytes\d*|u?int\d*|u?fixed[\dx]*)$/;

function filterWithInit(file: string, source: string, isLocal: (file: string) => boolean): string {
  const [header, ...blocks] = source.split(/^(?=import ")/m);
  const kept = blocks
    .map(block => {
      const [, importPath, name, params] = block.match(
        /^import "([^"]+)";\s+contract \w+ is (\w+) {\s+constructor\(([^)]*)\)/,
      )!;
      const types = params
        .split(',')
        .map(param => param.trim().match(/^\w+/)?.[0])
        .filter(type => type && !ELEMENTARY_TYPES.test(type));
      const symbols = [...new Set([name, ...types])];
      return { importPath, block: block.replace(/^import "/, `import {${symbols.join(', ')}} from "`) };
    })
    .filter(({ importPath }) => isLocal(path.join(path.dirname(file), importPath)))
    .map(({ block }) => block);
  return [header, ...kept].join('');
}
