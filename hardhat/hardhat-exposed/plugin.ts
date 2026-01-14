import { overrideTask } from 'hardhat/config';
import type { HardhatPlugin } from 'hardhat/types/plugins';

import type {} from './type-extensions';

const hardhatExposedPlugin: HardhatPlugin = {
  id: 'hardhat-exposed',
  hookHandlers: {
    config: () => import('./hook-handlers/config.js'),
    solidity: () => import('./hook-handlers/solidity.js'),
  },
  tasks: [
    overrideTask('clean')
      .setAction(() => import('./tasks/clean.js'))
      .build(),
    overrideTask('build')
      .setAction(() => import('./tasks/build.js'))
      .build(),
  ],
  npmPackage: 'hardhat-exposed',
};

export default hardhatExposedPlugin;
