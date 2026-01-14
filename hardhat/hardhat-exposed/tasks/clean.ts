import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import type {} from '../type-extensions';

import { cleanExposed } from '../core';

// See: hardhat/src/internal/builtin-plugins/clean/task-action.ts
type TaskArguments = any;
// interface TaskArguments {
//   global: boolean;
// }

export default async function (
  taskArguments: TaskArguments,
  hre: HardhatRuntimeEnvironment,
  superCall: (taskArguments: TaskArguments) => Promise<any>,
) {
  if (!taskArguments.global) {
    await cleanExposed(hre.config);
  }
  return superCall(taskArguments);
}
