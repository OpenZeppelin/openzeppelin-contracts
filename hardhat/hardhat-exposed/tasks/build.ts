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
  if (!args.noExpose) {
    await hre.tasks.getTask('generate-exposed-contracts').run({ force: 'force' in args ? args.force : false });

    // The exposed contracts output directory is not part of the project sources (see the `config` hook). Add it now
    // that its content is up to date, so that it gets compiled. This has to be an in-place mutation: the solidity
    // build system captures this array by reference when the HRE is created.
    if (!hre.config.paths.sources.solidity.includes(hre.config.exposed.outDir)) {
      hre.config.paths.sources.solidity.push(hre.config.exposed.outDir);
    }
  } else if (args.files.length === 0 && !args.noContracts && !args.noTests) {
    // Hardhat only cleans up "stale" artifacts on a full build (no file, and no `--no-contracts`/`--no-tests` flag).
    // Since the exposed contracts are not in the compilation scope here, that cleanup would remove their artifacts,
    // forcing the next regular build to recompile all of them. Listing the root files explicitly turns the full build
    // into a partial one, which leaves the existing artifacts alone.
    args.files = [
      ...(await hre.solidity.getRootFilePaths({ scope: 'contracts' })),
      ...(hre.config.solidity.splitTestsCompilation ? await hre.solidity.getRootFilePaths({ scope: 'tests' }) : []),
    ];
  }

  return await runSuper(args);
}
