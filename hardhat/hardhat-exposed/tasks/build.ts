import path from 'node:path';

import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import type { TaskArguments } from 'hardhat/types/tasks';

export interface BuildOverrideArguments {
  files: string[];
  noContracts: boolean;
  noExpose: boolean;
  noTests: boolean;
}

export default async function build(
  args: BuildOverrideArguments,
  hre: HardhatRuntimeEnvironment,
  runSuper: (taskArguments: TaskArguments) => Promise<any>,
) {
  if (args.noExpose !== true) {
    await hre.tasks.getTask('generate-exposed-contracts').run({ force: 'force' in args ? args.force : false });
    return await runSuper(args);
  }

  // The `config` hook unconditionally adds the exposed contracts output directory to the compilation scope. Drop it
  // here, so that `--noExpose` doesn't compile the (possibly stale) exposed contracts left over by a previous build.
  // This has to be an in-place mutation: the solidity build system captures this array by reference when the HRE is
  // created.
  const sources = hre.config.paths.sources.solidity;
  const index = sources.findIndex(source => path.resolve(source) === hre.config.exposed.outDir);
  if (index !== -1) sources.splice(index, 1);

  // Hardhat only cleans up "stale" artifacts on a full build (no file, and no `--no-contracts`/`--no-tests` flag).
  // Since the exposed contracts are no longer part of the compilation scope, that cleanup would remove their
  // artifacts, forcing the next regular build to recompile all of them. Listing the (now filtered) root files
  // explicitly turns the full build into a partial one, which leaves the existing artifacts alone.
  if (args.files.length === 0 && !args.noContracts && !args.noTests) {
    args = {
      ...args,
      files: [
        ...(await hre.solidity.getRootFilePaths({ scope: 'contracts' })),
        ...(hre.config.solidity.splitTestsCompilation ? await hre.solidity.getRootFilePaths({ scope: 'tests' }) : []),
      ],
    };
  }

  return await runSuper(args);
}
