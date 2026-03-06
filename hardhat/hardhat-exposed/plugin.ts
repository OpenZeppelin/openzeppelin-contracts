import type { HardhatPlugin } from 'hardhat/types/plugins';
import { overrideTask } from 'hardhat/config';

import type {} from './type-extensions.ts';

const hardhatExposedPlugin: HardhatPlugin = {
  id: 'hardhat-exposed',
  hookHandlers: {
    clean: () => import('./hook-handlers/clean.ts'),
    config: () => import('./hook-handlers/config.ts'),
    solidity: () => import('./hook-handlers/solidity.ts'),
  },
  tasks: [
    overrideTask('compile')
      .addFlag({ name: 'noExpose', description: 'Skip generation of exposed contracts.' })
      .setAction(() =>
        Promise.resolve({
          default: (args, hre, runSuper) => runSuper(args), // TODO: pass flag to solidity hook handler to suppress exposed contract generation
        }),
      )
      .build(),
  ],
};

export default hardhatExposedPlugin;
