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

async function loadSettings(hre: HardhatRuntimeEnvironment, settings: string): Promise<TranspileOptions> {
  const makeProjectPath = (p: string) =>
    path.join('project', path.isAbsolute(p) ? path.relative(hre.config.paths.root, p) : p);

  const options: TranspileOptions = await fs.readFile(settings, 'utf-8').then(JSON.parse);
  options.initializablePath = options.initializablePath && makeProjectPath(options.initializablePath);
  options.exclude = options.exclude?.map(makeProjectPath);
  options.publicInitializers = options.publicInitializers?.map(makeProjectPath);
  options.namespaceExclude = options.namespaceExclude?.map(makeProjectPath);

  return options;
}

export default async function ({ settings }: { settings?: string }, hre: HardhatRuntimeEnvironment) {
  assert(settings, 'Transpile settings file must be provided');
  const options = await loadSettings(hre, settings);

  const { contractRootPaths } = await hre.tasks.getTask('compile').run({ noTests: true, noExpose: true });
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

    // Run transpilation on the first source folder
    const transpiled = await transpile(
      input,
      output,
      { root: hre.config.paths.root, sources: hre.config.paths.sources.solidity.at(0)! },
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
      ([] as string[])
        .concat(
          transpiled.map(t => t.path),
          findAlreadyInitializable(output, options.initializablePath),
        )
        .map(p => path.join(hre.config.paths.root, p.replace(/^project\//, '')))
        .forEach(p => keep.add(p));

      if (options.initializablePath && options.peerProject === undefined) {
        keep.add(path.join(hre.config.paths.root, options.initializablePath.replace(/^project\//, '')));
      }

      Object.keys(output.sources)
        .map(s => path.join(hre.config.paths.root, s.replace(/^project\//, '')))
        .forEach(p => seen.add(p));
    }
  }

  // Perform delete
  await Promise.all([...seen].filter(p => !keep.has(p)).map(p => fs.unlink(p).catch(() => {})));
}
