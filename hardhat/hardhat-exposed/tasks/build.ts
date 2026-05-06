import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import type { TaskArguments } from 'hardhat/types/tasks';

export interface BuildOverrideArguments {
  noExpose: boolean;
}

export default async function build(
  args: BuildOverrideArguments,
  hre: HardhatRuntimeEnvironment,
  runSuper: (taskArguments: TaskArguments) => Promise<any>,
) {
  if (args.noExpose !== true) {
    await hre.tasks
      .getTask('generate-exposed-contracts')
      .run({ force: args.force ?? false });
  }

  return await runSuper(args);
}
