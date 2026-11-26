import type { HardhatPlugin } from 'hardhat/types/plugins';
import { overrideTask, task } from 'hardhat/config';

export type * from './type-extensions.ts';

const hardhatExposedPlugin: HardhatPlugin = {
  id: 'hardhat-exposed',
  hookHandlers: {
    clean: () => import('./hook-handlers/clean.ts'),
    config: () => import('./hook-handlers/config.ts'),
  },
  tasks: [
    overrideTask('build')
      .addFlag({ name: 'noExpose', description: 'Skip generation of exposed contracts.' })
      .setAction(() => import('./tasks/build.ts'))
      .build(),
    task('generate-exposed-contracts', 'Generates the exposed contracts')
      .addFlag({ name: 'force', description: 'Generate all contracts, ignoring the compilation cache' })
      .setAction(() => import('./tasks/generate-exposed-contracts.ts'))
      .build(),
  ],
};

export default hardhatExposedPlugin;
