import assert from 'node:assert';
import fs from 'node:fs/promises';
import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import type { SolidityBuildInfo, SolidityBuildInfoOutput } from 'hardhat/types/solidity';

import { main } from '../internal/main.ts';
import { mapKeys } from '../internal/utils/map-keys.ts';
import { filterKeys } from '../internal/utils/filter-keys.ts';

export default async function ({}, hre: HardhatRuntimeEnvironment) {
  const { contractRootPaths } = await hre.tasks.getTask('build').run({ noTests: true, noExpose: true });
  const compilationJobs = await hre.solidity.getCompilationJobs(contractRootPaths);
  assert('cacheHits' in compilationJobs, 'Compilation jobs not found');

  const buildIds: Set<string> = new Set();
  for (const { buildId } of compilationJobs.cacheHits.values()) {
    buildIds.add(buildId);
  }

  const mainSourcesRel = hre.config.docgen.sourcesDir!;

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

    // Adjust paths to match downstream consumer expectations
    input.sources = filterKeys(
      mapKeys(input.sources, k => k.replace(/^project\//, '')),
      k => k.startsWith(mainSourcesRel + '/'),
    );
    output.sources = filterKeys(
      mapKeys(output.sources, k => k.replace(/^project\//, '')),
      k => k.startsWith(mainSourcesRel + '/'),
    );
    output.contracts = filterKeys(
      mapKeys(output.contracts ?? {}, k => k.replace(/^project\//, '')),
      k => k.startsWith(mainSourcesRel + '/'),
    );
    Object.values(output.sources).forEach((s: any) => {
      s.ast.absolutePath = s.ast.absolutePath.replace(/^project\//, '');
    });

    builds.push({ input, output });
  }

  await main(builds, hre.config.docgen);
}
