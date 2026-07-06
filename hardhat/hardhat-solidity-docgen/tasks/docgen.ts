import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import type { SolidityBuildInfo, SolidityBuildInfoOutput } from 'hardhat/types/solidity';

import { main } from '../internal/main.ts';

// Transform each key of `obj` with `fn`, keeping values intact.
function transformKeys<U>(obj: Record<string, U>, fn: (key: string) => string): Record<string, U> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [fn(k), v]));
}

// Filter `obj` entries by predicate.
function filterRecord<U>(obj: Record<string, U>, fn: (key: string, value: U) => boolean): Record<string, U> {
  return Object.fromEntries(Object.entries(obj).filter(([k, v]) => fn(k, v)));
}

export default async function ({}, hre: HardhatRuntimeEnvironment) {
  const { contractRootPaths } = await hre.tasks.getTask('build').run({ noTests: true, noExpose: true });
  const compilationJobs = await hre.solidity.getCompilationJobs(contractRootPaths);
  assert('cacheHits' in compilationJobs, 'Compilation jobs not found');

  const buildIds: Set<string> = new Set();
  for (const { buildId } of compilationJobs.cacheHits.values()) {
    buildIds.add(buildId);
  }

  const mainSources = hre.config.paths.sources.solidity.at(0)!;
  const mainSourcesRel = path.relative(hre.config.paths.root, mainSources);

  const builds: { input: SolidityBuildInfo['input']; output: SolidityBuildInfoOutput['output'] }[] = [];
  for (const buildId of buildIds) {
    // Load build info
    const { input } = (await hre.artifacts
      .getBuildInfoPath(buildId)
      .then(file => fs.readFile(file!, 'utf-8'))
      .then(JSON.parse)) as SolidityBuildInfo;
    const { output } = (await hre.artifacts
      .getBuildInfoOutputPath(buildId)
      .then(file => fs.readFile(file!, 'utf-8'))
      .then(JSON.parse)) as SolidityBuildInfoOutput;

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

    // Add to builds
    builds.push({ input, output });
  }

  await main(builds, hre.config.docgen);
}
