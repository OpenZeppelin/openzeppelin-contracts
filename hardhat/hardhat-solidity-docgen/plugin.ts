import type { HardhatPlugin } from 'hardhat/types/plugins';
import { task } from 'hardhat/config';

export type * from './type-extensions.ts';

const hardhatSolidityDocgenPlugin: HardhatPlugin = {
  id: 'hardhat-solidity-docgen',
  hookHandlers: {
    config: () => import('./hook-handlers/config.ts'),
  },
  tasks: [
    task('docgen', 'Generates the exposed contracts')
      .setAction(() => import('./tasks/docgen.ts'))
      .build(),
  ],
};

export default hardhatSolidityDocgenPlugin;
