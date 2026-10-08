import type { HardhatPlugin } from 'hardhat/types/plugins';
import { overrideTask, task } from 'hardhat/config';

const hardhatYulPlugin: HardhatPlugin = {
  id: 'hardhat-yul',
  tasks: [
    // Make `hardhat compile` also compile the Yul sources.
    overrideTask('build')
      .setAction(() => import('./tasks/build.ts'))
      .build(),
    task('compile-yul', 'Compiles contracts/**/*.yul and writes their bytecode to artifacts/yul')
      .setAction(() => import('./tasks/compile-yul.ts'))
      .build(),
  ],
};

export default hardhatYulPlugin;
