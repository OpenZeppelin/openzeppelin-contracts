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
}

// Transform each key of `obj` with `fn`, keeping values intact.
function transformKeys<U>(obj: Record<string, U>, fn: (key: string) => string): Record<string, U> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [fn(k), v]));
}

// Filter `obj` entries by predicate.
function filterRecord<U>(obj: Record<string, U>, fn: (key: string, value: U) => boolean): Record<string, U> {
  return Object.fromEntries(Object.entries(obj).filter(([k, v]) => fn(k, v)));
}

export default async function ({ settings }: { settings?: string }, hre: HardhatRuntimeEnvironment) {
  assert(settings, 'Transpile settings file must be provided');
  const options: TranspileOptions = await fs.readFile(settings, 'utf-8').then(JSON.parse);

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

    // Adjust paths to match transpiler expectations
    input.sources = filterRecord(
      transformKeys(input.sources, k => k.replace(/^project\//, '')),
      k => k.startsWith(mainSourcesRel + '/'),
    );
    output.sources = filterRecord(
      transformKeys(output.sources, k => k.replace(/^project\//, '')),
      k => k.startsWith(mainSourcesRel + '/'),
    );
    output.contracts = filterRecord(
      transformKeys(output.contracts, k => k.replace(/^project\//, '')),
      k => k.startsWith(mainSourcesRel + '/'),
    );
    Object.values(output.sources).forEach((s: any) => {
      s.ast.absolutePath = s.ast.absolutePath.replace(/^project\//, '');
    });

    // Run transpilation on the first source folder
    const transpiled = await transpile(
      input,
      output,
      { root: hre.config.paths.root, sources: mainSources },
      { ...options, solcVersion },
    );

    // Write transpiled files to disk
    await Promise.all(
      transpiled.map(async t => {
        const outputPath = path.join(hre.config.paths.root, t.path.replace(/^project\//, ''));
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, t.source);
      }),
    );

    // Delete originals files
    if (options.deleteOriginals) {
      const alreadyInitializable = findAlreadyInitializable(output, options.initializablePath);

      // keep all newly transpiled files, plus any already-initializable files (even if not transpiled, to avoid deleting them)
      ([] as string[])
        .concat(
          transpiled.map(t => t.path),
          alreadyInitializable,
        )
        .map(p => path.join(hre.config.paths.root, p.replace(/^project\//, '')))
        .forEach(p => keep.add(p));

      // If we have an initializablePath and no peer project, we need to preserve the initializablePath.
      if (options.initializablePath && options.peerProject === undefined) {
        keep.add(path.join(hre.config.paths.root, options.initializablePath.replace(/^project\//, '')));
      }

      Object.keys(output.sources)
        .map(s => path.join(hre.config.paths.root, s.replace(/^project\//, '')))
        .forEach(p => seen.add(p));

      // If we have a peer project, initializable file present in the main source must be removed from the peer source
      // to avoid conflicts. Since we don't know which source location may contain the peer project, we check all the
      // solidity source file. Note that if the file does not exist, it will simply be ignored when we try to delete it.
      if (options.peerProject) {
        alreadyInitializable
          .filter(f => f.startsWith(mainSourcesRel + '/'))
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
