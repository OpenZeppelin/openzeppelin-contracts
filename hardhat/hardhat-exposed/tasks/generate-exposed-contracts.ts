import { createSpinner } from '@nomicfoundation/hardhat-utils/spinner';

import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import type { CompilationJob, SolidityBuildInfo } from 'hardhat/types/solidity';
import type { Result } from 'hardhat/types/utils';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { getExposed } from '../internal/expose.ts';
import { compilationJobToAstOnlyBuildInfo } from '../internal/build-info.ts';
import { ExposedManifest } from '../internal/manifest.ts';
import { errorResult, successfulResult } from 'hardhat/utils/result';

export type * from '../type-extensions.ts';

export interface GenerateExposedContractsArguments {
  force: boolean;
}

export default async function generateExposedContracts(
  args: GenerateExposedContractsArguments,
  hre: HardhatRuntimeEnvironment,
): Promise<Result<void, void>> {
  const rootPaths = await hre.solidity.getRootFilePaths();

  const isInExposedOutDir = (file: string) => {
    const rel = path.relative(path.resolve(hre.config.exposed.outDir), path.resolve(file));
    return rel !== '..' && !rel.startsWith('..' + path.sep);
  };

  const includes = async (rootPath: string) =>
    hre.config.exposed.include.some(p => path.matchesGlob(rootPath, p)) &&
    !hre.config.exposed.exclude.some(p => path.matchesGlob(rootPath, p)) &&
    !isInExposedOutDir(rootPath) &&
    (await hre.solidity.getScope(rootPath)) === 'contracts';

  const inclusionResults = await Promise.all(rootPaths.map(root => includes(root)));
  const rootPathsToExpose = rootPaths.filter((_, i) => inclusionResults[i]);

  // Without a manifest the content of the output directory is unknown: start over from an empty one. If some exposed
  // files went missing, regenerate everything as well: cached roots are not part of the compilation jobs otherwise.
  const loadedManifest = ExposedManifest.load(hre.config.paths.root, hre.config.exposed.outDir);
  if (loadedManifest === undefined) {
    fs.rmSync(hre.config.exposed.outDir, { recursive: true, force: true });
  }
  const manifest = loadedManifest ?? ExposedManifest.empty(hre.config.paths.root, hre.config.exposed.outDir);
  const force = args.force || loadedManifest === undefined || manifest.hasMissingFiles();

  const compilationJobs = await hre.solidity.getCompilationJobs(rootPathsToExpose, { force });

  if (!compilationJobs.success) {
    console.error("Failed to generate exposed contracts: couldn't get the compilations jobs");
    console.error(compilationJobs.formattedReason);
    return errorResult();
  }

  const filteredRootPathsToExpose = rootPathsToExpose.filter(p => force || !compilationJobs.cacheHits.has(p));

  // Roots of the compilation job, restricted to the ones being exposed. All of them are regenerated together.
  const rootPathsToExposeSet = new Set(rootPathsToExpose);
  const getExposedRoots = (compilationJob: CompilationJob) =>
    Array.from(compilationJob.dependencyGraph.getRoots().values(), f => f.fsPath).filter(p =>
      rootPathsToExposeSet.has(p),
    );

  const astOnlyBuildInfos = new Map<SolidityBuildInfo, string[]>();
  const compilationJobIds = new Set<string>();
  for (const rootPath of filteredRootPathsToExpose) {
    const compilationJob = compilationJobs.compilationJobsPerFile.get(rootPath)!;
    const compilationJobId = await compilationJob.getBuildId();

    if (compilationJobIds.has(compilationJobId)) {
      continue;
    }

    compilationJobIds.add(compilationJobId);
    astOnlyBuildInfos.set(await compilationJobToAstOnlyBuildInfo(compilationJob), getExposedRoots(compilationJob));
  }

  const exposedPaths: Set<string> = new Set();
  const spinner = createSpinner({ text: `Generating exposed contracts...` });
  if (astOnlyBuildInfos.size > 0) spinner.start();

  try {
    for (const [buildInfo, roots] of astOnlyBuildInfos) {
      // Sanity check: No exposed contract should be included as part of the
      // sources of the ast-only build-info
      for (const inputSourceName of Object.keys(buildInfo.input.sources)) {
        assert(
          !isInExposedOutDir(inputSourceName),
          'No exposed contract should be included in the ast-only compilation jobs',
        );
      }

      const buildOutput = await hre.solidity.compileBuildInfo(buildInfo);

      // A failed compilation produces no sources at all, which would make the AST processing below fail with a
      // confusing error. The errors are not printed here: this build info is a subset of what the build task
      // compiles right after, so the build reports them itself, with the proper exit code.
      if (buildOutput.errors?.some(error => error.severity === 'error')) {
        return errorResult();
      }

      const exposed = getExposed(buildInfo, buildOutput, hre.config);

      for (const [exposedPath, exposedContent] of exposed) {
        fs.mkdirSync(path.dirname(exposedPath), { recursive: true });
        fs.writeFileSync(exposedPath, exposedContent);
        exposedPaths.add(exposedPath);
      }

      // The exposed file of a root mirrors its path. Other exposed files (see the `imports` option) are attributed to
      // all the roots of the job, as any of them may be the one importing it.
      const exposedPathToRoot = new Map(
        roots.map(root => [path.join(hre.config.exposed.outDir, path.relative(hre.config.paths.root, root)), root]),
      );
      manifest.setGenerated(
        roots,
        new Map(Array.from(exposed.keys(), p => [p, exposedPathToRoot.has(p) ? [exposedPathToRoot.get(p)!] : roots])),
      );
    }
  } finally {
    spinner.stop();
    // Also on failure, so that the files generated so far are tracked. Roots that were not regenerated keep the
    // files they produced before, unless they are not exposed anymore.
    manifest.prune(rootPathsToExpose);
  }

  if (exposedPaths.size > 0) {
    console.log(`Generated ${exposedPaths.size} exposed contract files`);
  }
  return successfulResult();
}
