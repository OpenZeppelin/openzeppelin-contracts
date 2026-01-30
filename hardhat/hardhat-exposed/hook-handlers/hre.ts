import micromatch from 'micromatch';

import type { HardhatRuntimeEnvironmentHooks, HookContext } from 'hardhat/types/hooks';
import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import type { BuildOptions, SolidityBuildSystem } from 'hardhat/types/solidity';
import { createSpinner } from '@nomicfoundation/hardhat-utils/spinner';

import { getExposed, writeExposed } from '../core/index.ts';

const overrideBuild =
  (context: HookContext, runSuper: SolidityBuildSystem['build']) =>
  async (rootFilePaths: string[], options?: BuildOptions) => {
    switch (options?.scope) {
      case 'contracts':
        const compilationJobsResult = await context.solidity.getCompilationJobs(rootFilePaths, options);

        if ('reason' in compilationJobsResult) break;

        // Determine which files to include
        const include = (sourceName: string): boolean => {
          const file = sourceName.replace(/^project\//g, '');
          return (
            compilationJobsResult.compilationJobsPerFile.has(file) &&
            context.config.exposed.include.some((p: string) => micromatch.isMatch(file, p)) &&
            !context.config.exposed.exclude.some((p: string) => micromatch.isMatch(file, p))
          );
        };

        const spinner = createSpinner({
          text: `Generation of exposed contracts...`,
          enabled: true,
        });
        spinner.start();

        // Expose selected contracts from each compilation job
        const processed: Set<string> = new Set();
        for (const job of compilationJobsResult.compilationJobsPerFile.values()) {
          const key = await job.getBuildId();

          // Avoid processing the same job multiple times
          if (processed.has(key)) continue;
          processed.add(key);

          // Override job settings
          const oldEnabled = job.solcConfig.settings.optimizer.enabled;
          const oldOutputSelection = job.solcConfig.settings.outputSelection;
          job.solcConfig.settings.optimizer.enabled = false;
          job.solcConfig.settings.outputSelection = { '*': { '': ['ast'] } };

          // Run precompilation
          const { output } = await context.solidity.runCompilationJob(job, options);

          // Restore job settings
          job.solcConfig.settings.optimizer.enabled = oldEnabled;
          job.solcConfig.settings.outputSelection = oldOutputSelection;

          // Generate and write exposed artifacts
          const exposed = await getExposed(output, include, context.config);
          await writeExposed(exposed);

          // Add exposed files to rootFilePaths for actual compilation
          rootFilePaths.push(...exposed.keys());
        }

        // Remove duplicates
        rootFilePaths = rootFilePaths.filter((value, index, array) => array.indexOf(value) === index);

        spinner.stop();
        break;

      case 'tests':
        break;
    }

    return await runSuper(rootFilePaths, options);
  };

export default async (): Promise<Partial<HardhatRuntimeEnvironmentHooks>> => ({
  created: async (context: HookContext, hre: HardhatRuntimeEnvironment): Promise<void> => {
    hre.solidity.build = overrideBuild(context, hre.solidity.build.bind(hre.solidity));
  },
});
