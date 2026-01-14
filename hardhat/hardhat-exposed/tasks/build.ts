import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import type {} from '../type-extensions';

import { cleanExposed } from '../core';

// See: hardhat/src/internal/builtin-plugins/solidity/tasks/build.ts
type BuildActionArguments = any;
// interface BuildActionArguments {
//   force: boolean;
//   files: string[];
//   quiet: boolean;
//   defaultBuildProfile: string | undefined;
//   noTests: boolean;
//   noContracts: boolean;
// }

export default async function (
  taskArguments: BuildActionArguments,
  hre: HardhatRuntimeEnvironment,
  superCall: (taskArguments: BuildActionArguments) => Promise<any>,
) {
  if (taskArguments.force) {
    await cleanExposed(hre.config);
  }
  return superCall(taskArguments);
}
