import type { HardhatPlugin } from 'hardhat/types/plugins';
import { overrideTask } from 'hardhat/config';

import type {} from './type-extensions.ts';

const hardhatExposedPlugin: HardhatPlugin = {
  id: 'hardhat-exposed',
  hookHandlers: {
    clean: () => import('./hook-handlers/clean.ts'),
    config: () => import('./hook-handlers/config.ts'),
  },
  tasks: [
    overrideTask('compile')
      .addFlag({ name: 'noExpose', description: 'Skip generation of exposed contracts.' })
      .setAction(() =>
        Promise.resolve({
          default: (args, hre, runSuper) =>
            import('./hook-handlers/solidity.ts')
              .then(hooks => hooks.default())
              .then(hooks => {
                if (args.noExpose) {
                  hre.hooks.unregisterHandlers('solidity', hooks);
                } else {
                  hre.hooks.registerHandlers('solidity', hooks);
                }
              })
              .then(() => runSuper(args)),
        }),
      )
      .build(),
  ],
};

export default hardhatExposedPlugin;
