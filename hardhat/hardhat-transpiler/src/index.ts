import type { HardhatPlugin } from 'hardhat/types/plugins';
import { ArgumentType } from 'hardhat/types/arguments';
import { task } from 'hardhat/config';

const hardhatTranspilerPlugin: HardhatPlugin = {
  id: 'hardhat-transpiler',
  tasks: [
    task('transpile', 'Transpile contracts.')
      .addOption({
        name: 'settings',
        description: 'Path to the transpiler config file.',
        type: ArgumentType.STRING_WITHOUT_DEFAULT,
        defaultValue: undefined,
      })
      .setAction(() => import('./tasks/transpile.ts'))
      .build(),
  ],
};

export default hardhatTranspilerPlugin;
