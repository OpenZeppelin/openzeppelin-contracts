import { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import { TaskArguments } from 'hardhat/types/tasks';

export interface BuildOverrideArguments {
  noExpose: boolean;
}

export default async function build(
  args: BuildOverrideArguments,
  hre: HardhatRuntimeEnvironment,
  runSuper: (taskArguments: TaskArguments) => Promise<any>,
) {
  if (args.noExpose !== true) {
    const exposeTask = hre.tasks.getTask('generate-exposed-contracts');

    // `force` is inherited from `build`
    const force = 'force' in args ? args.force : false;

    await exposeTask.run({ force });
  }

  return runSuper(args);
}
