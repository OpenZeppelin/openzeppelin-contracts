import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { HardhatRuntimeEnvironment } from 'hardhat/types/hre';

import { transpile } from '@openzeppelin/upgrade-safe-transpiler/dist/index.js';
import { findAlreadyInitializable } from '@openzeppelin/upgrade-safe-transpiler/dist/find-already-initializable.js';

interface TranspileOptions {
  initializablePath?: string;
  deleteOriginals?: boolean;
  skipWithInit?: boolean;
  exclude?: string[];
  publicInitializers?: string[];
  namespaced?: boolean;
  namespaceExclude?: string[];
  peerProject?: string;
  /**
   * Import prefixes of the dependencies whose stateful contracts have an upgradeable variant in another package (e.g.
   * `{ "@openzeppelin/contracts/": "@openzeppelin/contracts-upgradeable/" }`).
   *
   * Setting this option enables the transpilation of a project that builds on contracts it does not own. Dependency
   * sources are kept in the transpilation so that their symbols can be resolved, but their transpiled output is
   * discarded. Imports in the transpiled files are rewritten so that stateful contracts are imported from the
   * upgradeable package, and stateless declarations (interfaces, libraries, ...) from their original location. In this
   * mode, `peerProject` is required and is prepended to the source name of local files (e.g. `@openzeppelin/community-`
   * for `contracts/` to be imported from `@openzeppelin/community-contracts/`), and `initializablePath` is an import
   * path (e.g. `@openzeppelin/contracts/proxy/utils/Initializable.sol`).
   */
  upgradeablePackages?: Record<string, string>;
}

// Transform each key of `obj` with `fn`, keeping values intact.
function transformKeys<U>(obj: Record<string, U>, fn: (key: string) => string): Record<string, U> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [fn(k), v]));
}

// Filter `obj` entries by predicate.
function filterRecord<U>(obj: Record<string, U>, fn: (key: string, value: U) => boolean): Record<string, U> {
  return Object.fromEntries(Object.entries(obj).filter(([k, v]) => fn(k, v)));
}

// Remove the `project/` prefix that Hardhat 3 adds to the source names of local files.
const stripProject = (sourceName: string) => sourceName.replace(/^project\//, '');

// Find the entry of `mapping` whose key is the longest prefix of `str`, and replace that prefix with the value.
function replacePrefix(str: string, mapping: [string, string][]): string {
  const match = mapping.toSorted(([a], [b]) => b.length - a.length).find(([from]) => str.startsWith(from));
  return match ? match[1] + str.slice(match[0].length) : str;
}

// Placeholder for the peer project, used when transpiling with dependencies. It lets imports from the peer project be
// identified and resolved once the transpilation is done.
const PEER_PLACEHOLDER = '__peer__';

export default async function ({ settings }: { settings?: string }, hre: HardhatRuntimeEnvironment) {
  assert(settings, 'Transpile settings file must be provided');
  const options: TranspileOptions = await fs.readFile(settings, 'utf-8').then(JSON.parse);
  assert(
    options.upgradeablePackages === undefined || options.peerProject !== undefined,
    'Transpiling dependencies requires a peer project',
  );

  const { contractRootPaths } = await hre.tasks.getTask('build').run({ noTests: true, noExpose: true });
  const compilationJobs = await hre.solidity.getCompilationJobs(contractRootPaths);
  assert('cacheHits' in compilationJobs, 'Compilation jobs not found');

  const buildIds: Set<string> = new Set();
  for (const { buildId } of compilationJobs.cacheHits.values()) {
    buildIds.add(buildId);
  }

  const keep: Set<string> = new Set();
  const seen: Set<string> = new Set();

  for (const buildId of buildIds) {
    // Load build info
    const { input, solcVersion } = await hre.artifacts
      .getBuildInfoPath(buildId)
      .then(file => fs.readFile(file!, 'utf-8'))
      .then(JSON.parse);
    const { output } = await hre.artifacts
      .getBuildInfoOutputPath(buildId)
      .then(file => fs.readFile(file!, 'utf-8'))
      .then(JSON.parse);

    const mainSources = hre.config.paths.sources.solidity.at(0)!;
    const mainSourcesRel = path.relative(hre.config.paths.root, mainSources);
    const isLocal = (file: string) => file.startsWith(mainSourcesRel + '/');
    const withDependencies = options.upgradeablePackages !== undefined;

    // Adjust paths to match transpiler expectations. Unless transpiling with dependencies, only the main sources are
    // kept.
    const keepSource = (sourceName: string) => withDependencies || isLocal(sourceName);
    input.sources = filterRecord(transformKeys(input.sources, stripProject), keepSource);
    output.sources = filterRecord(transformKeys(output.sources, stripProject), keepSource);
    output.contracts = filterRecord(transformKeys(output.contracts, stripProject), keepSource);
    Object.values(output.sources).forEach((s: any) => {
      s.ast.absolutePath = stripProject(s.ast.absolutePath);
    });

    // Transpiling with dependencies requires the AST, the transpiler options and the transpiled output to be
    // adjusted. Without dependencies the options are passed through and the transpiled files are written as they come.
    let alreadyInitializable: string[];
    let optionsOverride: Partial<TranspileOptions> = {};
    let postProcess = (files: Awaited<ReturnType<typeof transpile>>) => files;

    if (withDependencies) {
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
      // for their symbols to be resolved, and their output is discarded, so their unaliased imports are expanded to
      // every exported symbol.
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

      // Contracts that already inherit from `Initializable` are left untouched. The transpiler would exclude them from
      // the transformation, but dependencies must stay included for their symbols to be resolved. Instead, only local
      // files are excluded, and `initializablePath` is not given to the transpiler. The transpiler then imports
      // `Initializable` from its default location in the peer project, which is redirected to `initializablePath`.
      alreadyInitializable = findAlreadyInitializable(
        output,
        options.initializablePath && toSourceName(options.initializablePath),
      );

      // Maps an import path produced by the transpiler to its final location.
      const resolveImport = (file: string, importPath: string): string => {
        if (
          importPath === path.join(PEER_PLACEHOLDER, mainSourcesRel, 'Initializable.sol') &&
          options.initializablePath
        ) {
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

      // Only keep the output for the main sources, and rewrite its imports.
      const withInitPath = path.join(mainSourcesRel, 'mocks', 'WithInit.sol');
      postProcess = files =>
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
          }));

      // `initializablePath` and `upgradeablePackages` are handled above and must not reach the transpiler.
      optionsOverride = {
        initializablePath: undefined,
        upgradeablePackages: undefined,
        exclude: [...(options.exclude ?? []), ...alreadyInitializable.filter(isLocal)],
        peerProject: PEER_PLACEHOLDER + '/',
      };
    } else {
      alreadyInitializable = findAlreadyInitializable(output, options.initializablePath);
    }

    // Run transpilation, and post-process the result
    const results = postProcess(
      await transpile(
        input,
        output,
        { root: hre.config.paths.root, sources: mainSources },
        { ...options, ...optionsOverride, solcVersion },
      ),
    );

    // Write transpiled files to disk
    await Promise.all(
      results.map(async t => {
        const outputPath = path.join(hre.config.paths.root, stripProject(t.path));
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, t.source);
      }),
    );

    // Delete originals files
    if (options.deleteOriginals) {
      // keep all newly transpiled files, plus any already-initializable files (even if not transpiled, to avoid deleting them)
      [...results.map(t => t.path), ...alreadyInitializable]
        .map(p => path.join(hre.config.paths.root, stripProject(p)))
        .forEach(p => keep.add(p));

      // If we have an initializablePath and no peer project, we need to preserve the initializablePath.
      if (options.initializablePath && options.peerProject === undefined) {
        keep.add(path.join(hre.config.paths.root, stripProject(options.initializablePath)));
      }

      // Only local sources are candidates for deletion (without dependencies, every source is local).
      Object.keys(output.sources)
        .filter(isLocal)
        .map(s => path.join(hre.config.paths.root, s))
        .forEach(p => seen.add(p));

      // If we have a peer project, initializable file present in the main source must be removed from the peer
      // source to avoid conflicts. Since we don't know which source location may contain the peer project, we check
      // all the solidity source file. Note that if the file does not exist, it will simply be ignored when we try to
      // delete it.
      if (options.peerProject) {
        alreadyInitializable
          .filter(isLocal)
          .flatMap(f =>
            hre.config.paths.sources.solidity
              .slice(1)
              .map(peerSources => path.join(peerSources, path.relative(mainSourcesRel, f))),
          )
          .forEach(p => seen.add(p));
      }
    }
  }

  // Perform delete
  await Promise.all([...seen].filter(p => !keep.has(p)).map(p => fs.unlink(p).catch(() => {})));
}

// When transpiling with dependencies, the generated `WithInit` file contains a block for every transformed contract,
// including those from dependencies. Only the blocks corresponding to local contracts are kept. Their imports are
// restricted to the contract and the user-defined types of its constructor arguments, to avoid clashes between symbols
// the imported files bring into scope.
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
