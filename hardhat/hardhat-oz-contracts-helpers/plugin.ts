import type { HardhatPlugin } from 'hardhat/types/plugins';

import type {} from './type-extensions.ts';

const hardhatOzContractsHelpers: HardhatPlugin = {
  id: 'hardhat-oz-contracts-helpers',
  hookHandlers: {
    hre: () => import('./hook-handlers/hre.ts'),
    network: () => import('./hook-handlers/network.ts'),
  },
  dependencies: () => [import('@nomicfoundation/hardhat-ethers')],
  npmPackage: null,
};

export default hardhatOzContractsHelpers;
