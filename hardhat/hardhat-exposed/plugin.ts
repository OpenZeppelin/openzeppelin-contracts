import type { HardhatPlugin } from 'hardhat/types/plugins';

import type {} from './type-extensions.js';

const hardhatExposedPlugin: HardhatPlugin = {
  id: 'hardhat-exposed',
  hookHandlers: {
    clean: () => import('./hook-handlers/clean.js'),
    config: () => import('./hook-handlers/config.js'),
    hre: () => import('./hook-handlers/hre.js'),
  },
};

export default hardhatExposedPlugin;
