import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import type { TaskArguments } from 'hardhat/types/tasks';

// Compile the Yul sources as part of the normal build, so `artifacts-yul/<name>.json` is always up to date.
export default async function build(
  args: TaskArguments,
  hre: HardhatRuntimeEnvironment,
  runSuper: (taskArguments: TaskArguments) => Promise<any>,
) {
  const result = await runSuper(args);
  await hre.tasks.getTask('compile-yul').run({});
  return result;
}
