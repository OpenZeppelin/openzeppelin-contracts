import type { HardhatPlugin } from 'hardhat/types/plugins';

import type {} from './type-extensions.js';

const hardhatOzContractsHelpers: HardhatPlugin = {
  id: 'hardhat-oz-contracts-helpers',
  hookHandlers: {
    hre: () => import('./hook-handlers/hre.js'),
    network: () => import('./hook-handlers/network.js'),
  },
  dependencies: () => [import('@nomicfoundation/hardhat-ethers')],
  npmPackage: null,
};

export default hardhatOzContractsHelpers;
