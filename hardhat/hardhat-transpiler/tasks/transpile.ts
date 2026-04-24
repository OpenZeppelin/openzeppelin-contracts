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

function transformKeys<U>(obj: Record<string, U>, fn: (key: string) => string): Record<string, U> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [fn(k), v]));
}

export default async function ({ settings }: { settings?: string }, hre: HardhatRuntimeEnvironment) {
  assert(settings, 'Transpile settings file must be provided');
  const options: TranspileOptions = await fs.readFile(settings, 'utf-8').then(JSON.parse);

  const { contractRootPaths } = await hre.tasks.getTask('compile').run({ noTests: true });
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

    // Adjust paths to match transpiler expectations
    input.sources = transformKeys(input.sources, k => k.replace(/^project\//, ''));
    output.sources = transformKeys(output.sources, k => k.replace(/^project\//, ''));
    output.contracts = transformKeys(output.contracts, k => k.replace(/^project\//, ''));
    Object.values(output.sources).forEach((s: any) => {
      s.ast.absolutePath = s.ast.absolutePath.replace(/^project\//, '');
    });

    const mainSources = hre.config.paths.sources.solidity.at(0)!;
    const mainSourcesRel = path.relative(hre.config.paths.root, mainSources);

    // Peer-project sources are compiled so downstream imports resolve, but they must not
    // enter the transpiler's transform set — the transpiler expects only main-project ASTs.
    input.sources = Object.fromEntries(
      Object.entries(input.sources).filter(([k]) => k.startsWith(mainSourcesRel + '/')),
    );

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

      ([] as string[])
        .concat(
          transpiled.map(t => t.path),
          alreadyInitializable,
        )
        .map(p => path.join(hre.config.paths.root, p.replace(/^project\//, '')))
        .forEach(p => keep.add(p));

      if (options.initializablePath && options.peerProject === undefined) {
        keep.add(path.join(hre.config.paths.root, options.initializablePath.replace(/^project\//, '')));
      }

      Object.keys(output.sources)
        .filter(s => s.startsWith(mainSourcesRel + '/'))
        .map(s => path.join(hre.config.paths.root, s.replace(/^project\//, '')))
        .forEach(p => seen.add(p));

      // Already-initializable files are kept as-is in the main tree (not renamed, not
      // transpiled). Their peer-tree copies, compiled alongside main, would produce
      // duplicate artifacts for every contract inside (triggering HHE1001 at deploy
      // time). Add the peer path for each already-initializable file to the delete set
      // so the main tree's copy is the sole source of truth.
      if (options.peerProject !== undefined) {
        const peerSources = hre.config.paths.sources.solidity[1];
        if (peerSources !== undefined) {
          const peerSourcesRel = path.relative(hre.config.paths.root, peerSources);
          alreadyInitializable
            .filter(p => p.startsWith(mainSourcesRel + '/'))
            .map(p => path.join(hre.config.paths.root, peerSourcesRel, path.relative(mainSourcesRel, p)))
            .forEach(p => seen.add(p));
        }
      }
    }
  }

  // Perform delete
  await Promise.all([...seen].filter(p => !keep.has(p)).map(p => fs.unlink(p).catch(() => {})));
}
