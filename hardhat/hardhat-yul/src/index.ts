import type { HardhatPlugin } from 'hardhat/types/plugins';

const hardhatYulPlugin: HardhatPlugin = {
  id: 'hardhat-yul',
  hookHandlers: {
    solidity: () => import('./hook-handlers/solidity.ts'),
  },
};

export default hardhatYulPlugin;
