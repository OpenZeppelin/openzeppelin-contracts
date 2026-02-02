import fs from 'node:fs';
import path from 'node:path';

import type { SolidityHooks } from 'hardhat/types/hooks';
import { FileBuildResultType } from 'hardhat/types/solidity';

import type {} from '../type-extensions';

import { getExposedPath, generateExposedContracts } from '../internal/expose.ts';

export default async (): Promise<Partial<SolidityHooks>> => ({
  build: async (context, rootPaths, options, next) => {
    const includes = (rootPath: string) =>
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

      // 2. Collect the files that need their exposed contracts regenerated
      //    - BUILD_SUCCESS (newly compiled)
      //    - CACHE_HIT with missing exposed file
      const exposedFilesToRegenerate: Array<{ rootPath: string; buildId: string }> = [];
      for (const [rootPath, result] of results) {
        if (!includes(rootPath)) continue;
        switch (result.type) {
          case FileBuildResultType.BUILD_SUCCESS:
            exposedFilesToRegenerate.push({
              rootPath,
              buildId: await result.compilationJob.getBuildId(),
            });
            break;
          case FileBuildResultType.CACHE_HIT:
            if (!fs.existsSync(getExposedPath(context, rootPath))) {
              exposedFilesToRegenerate.push({
                rootPath,
                buildId: result.buildId,
              });
            }
            break;
        }
      }

      // 3. Generate exposed contracts for the files that need it
      if (exposedFilesToRegenerate.length > 0) {
        await generateExposedContracts(context, exposedFilesToRegenerate);
      }

      // 4. Build all exposed contracts
      const exposedPaths = fs.globSync(path.join(context.config.exposed.outDir, '**', '*.sol'));
      const exposedResults = await context.solidity.build(exposedPaths, options);

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
