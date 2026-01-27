import { overrideTask } from 'hardhat/config';
import type { HardhatPlugin } from 'hardhat/types/plugins';

import type {} from './type-extensions.js';

const hardhatExposedPlugin: HardhatPlugin = {
  id: 'hardhat-exposed',
  hookHandlers: {
    config: () => import('./hook-handlers/config.js'),
    hre: () => import('./hook-handlers/hre.js'),
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
