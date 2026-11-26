import type { HardhatPlugin } from 'hardhat/types/plugins';

const hardhatLocalSolcPlugin: HardhatPlugin = {
  id: 'hardhat-local-solc',
  hookHandlers: {
    solidity: () => import('./hook-handlers/solidity.ts'),
  },
};

export default hardhatLocalSolcPlugin;
