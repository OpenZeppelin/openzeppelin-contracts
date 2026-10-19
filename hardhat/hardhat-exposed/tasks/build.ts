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
    // List roots explicitly to keep this a partial build; a full build's stale-artifact sweep would delete exposed artifacts.
    args.files = [
      ...(await hre.solidity.getRootFilePaths({ scope: 'contracts' })),
      ...(hre.config.solidity.splitTestsCompilation ? await hre.solidity.getRootFilePaths({ scope: 'tests' }) : []),
    ];
  }

  return runSuper(args);
}
