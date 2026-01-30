import type { HardhatPlugin } from 'hardhat/types/plugins';

import type {} from './type-extensions.ts';

const hardhatExposedPlugin: HardhatPlugin = {
  id: 'hardhat-exposed',
  hookHandlers: {
    clean: () => import('./hook-handlers/clean.ts'),
    config: () => import('./hook-handlers/config.ts'),
    hre: () => import('./hook-handlers/hre.ts'),
  },
  npmPackage: null,
};

export default hardhatExposedPlugin;
