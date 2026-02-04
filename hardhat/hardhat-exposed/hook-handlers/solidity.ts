import { assert } from 'node:console';
import fs from 'node:fs';
import path from 'node:path';

import type { SolidityHooks } from 'hardhat/types/hooks';
import { FileBuildResultType, SolidityBuildInfoOutput } from 'hardhat/types/solidity';
import { createSpinner } from '@nomicfoundation/hardhat-utils/spinner';

import { getExposed } from '../internal/expose.ts';

import type {} from '../type-extensions';

export default async (): Promise<Partial<SolidityHooks>> => ({
  build: async (context, rootPaths, options, next) => {
    const includes = (rootPath: string) =>
      rootPaths.includes(rootPath) &&
      context.config.exposed.include.some(p => path.matchesGlob(rootPath, p)) &&
      !context.config.exposed.exclude.some(p => path.matchesGlob(rootPath, p)) &&
      !rootPath.startsWith(context.config.exposed.outDir) &&
      !rootPath.startsWith('npm:');

    // Only apply expose logic when compiling contracts (skip for tests)
    if (options?.scope === 'contracts' && rootPaths.some(includes)) {
      // 1. Build the original contracts
      const results = await next(context, rootPaths, options);

      // Return errors instead of ignoring!
      if ('reason' in results) return results;

      // Start spinner
      const spinner = createSpinner({ text: `Generating exposed contracts...` });
      spinner.start();

      // 2. Recover the build IDs, and the corresponding root files
      const rootFilesPathsByBuildId: Set<string> = new Set();
      for (const [rootPath, result] of results) {
        if (!includes(rootPath)) continue;
        switch (result.type) {
          case FileBuildResultType.BUILD_SUCCESS: {
            rootFilesPathsByBuildId.add(await result.compilationJob.getBuildId());
            break;
          }
          case FileBuildResultType.CACHE_HIT: {
            rootFilesPathsByBuildId.add(result.buildId);
            break;
          }
        }
      }

      // 3. Generate all exposed contracts
      const exposedPaths: Set<string> = new Set();
      for (const buildId of rootFilesPathsByBuildId) {
        const outputPath = await context.artifacts.getBuildInfoOutputPath(buildId);
        assert(outputPath, `No build info found for build ID ${buildId}`);

        const { output } = JSON.parse(fs.readFileSync(outputPath!, 'utf-8')) as SolidityBuildInfoOutput;

        const exposed = await getExposed(output, includes, context.config);
        for (const [exposedPath, exposedContent] of exposed) {
          fs.mkdirSync(path.dirname(exposedPath), { recursive: true });
          fs.writeFileSync(exposedPath, exposedContent);
          exposedPaths.add(exposedPath);
        }
      }

      // Step spinner
      spinner.stop();

      // 4. Build all exposed contracts
      const exposedResults = await context.solidity.build(Array.from(exposedPaths), options);

      // Return errors instead of ignoring!
      if ('reason' in exposedResults) return exposedResults;

      // Merge ALL results
      for (const [filePath, result] of exposedResults) {
        results.set(filePath, result);
      }

      return results;
    } else {
      return next(context, rootPaths, options);
    }
  },
});
