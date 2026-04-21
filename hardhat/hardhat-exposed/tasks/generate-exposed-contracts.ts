import { createSpinner } from '@nomicfoundation/hardhat-utils/spinner';

import { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import { SolidityBuildInfo } from 'hardhat/types/solidity';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { getExposed } from '../internal/expose';
import { compilationJobToAstOnlyBuildInfo } from '../internal/build-info';
import { Result } from 'hardhat/types/utils';
import { errorResult, successfulResult } from 'hardhat/utils/result';

export type * from '../type-extensions';

export interface GenerateExposedContractsArguments {
  force: boolean;
}

export default async function generateExposedContracts(
  args: GenerateExposedContractsArguments,
  hre: HardhatRuntimeEnvironment,
): Promise<Result<void, void>> {
  const rootPaths = await hre.solidity.getRootFilePaths();

  const includes = async (rootPath: string) =>
    hre.config.exposed.include.some(p => path.matchesGlob(rootPath, p)) &&
    !hre.config.exposed.exclude.some(p => path.matchesGlob(rootPath, p)) &&
    !rootPath.startsWith(hre.config.exposed.outDir) &&
    (await hre.solidity.getScope(rootPath)) === 'contracts';

  const inclusionResults = await Promise.all(rootPaths.map(root => includes(root)));
  const rootPathsToExpose = rootPaths.filter((root, i) => {
    if (!inclusionResults[i]) return false;

    // sanity check: No exposed contract should be a root file to expose
    assert(
      !root.startsWith(hre.config.exposed.outDir),
      'A root file to be exposed must not be part of the in the hardhat-exposed outDir',
    );

    return true;
  });

  const compilationJobs = await hre.solidity.getCompilationJobs(rootPathsToExpose, { force: args.force });

  if (!compilationJobs.success) {
    console.error("Failed to generate exposed contracts: couldn't get the compilations jobs");
    console.error(compilationJobs.formattedReason);
    return errorResult();
  }

  const filteredRootPathsToExpose = rootPathsToExpose.filter(p => !compilationJobs.cacheHits.has(p) || args.force);

  if (filteredRootPathsToExpose.length === 0) {
    return successfulResult();
  }

  const astOnlyBuildInfos = new Set<SolidityBuildInfo>();
  const compilationJobIdToAstOnlyBuildInfo = new Map<string, SolidityBuildInfo>();
  for (const rootPath of filteredRootPathsToExpose) {
    const compilationJob = compilationJobs.compilationJobsPerFile.get(rootPath)!;
    const compilationJobId = await compilationJob.getBuildId();

    if (compilationJobIdToAstOnlyBuildInfo.has(compilationJobId)) {
      continue;
    }

    const astOnlyBuildInfo = await compilationJobToAstOnlyBuildInfo(compilationJob);
    compilationJobIdToAstOnlyBuildInfo.set(compilationJobId, astOnlyBuildInfo);
    astOnlyBuildInfos.add(astOnlyBuildInfo);
  }

  const exposedPaths: Set<string> = new Set();
  const spinner = createSpinner({ text: `Generating exposed contracts...` });
  spinner.start();

  try {
    for (const buildInfo of astOnlyBuildInfos) {
      // Sanity check: No exposed contract should be included as part of the
      // sources of the ast-only build-info
      for (const inputSourceName of Object.keys(buildInfo.input.sources)) {
        assert(
          !inputSourceName.startsWith(hre.config.exposed.outDir),
          'No exposed contract should be included in the ast-only compilation jobs',
        );
      }

      const buildOutput = await hre.solidity.compileBuildInfo(buildInfo);

      const exposed = await getExposed(buildInfo, buildOutput, hre.config);

      for (const [exposedPath, exposedContent] of exposed) {
        fs.mkdirSync(path.dirname(exposedPath), { recursive: true });
        fs.writeFileSync(exposedPath, exposedContent);
        exposedPaths.add(exposedPath);
      }
    }
  } finally {
    spinner.stop();
  }

  console.log(`Generated ${exposedPaths.size} exposed contract files`);
  return successfulResult();
}
