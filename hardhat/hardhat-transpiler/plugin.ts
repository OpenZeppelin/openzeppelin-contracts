import type { HardhatPlugin } from 'hardhat/types/plugins';
import { ArgumentType } from 'hardhat/types/arguments';
import { task } from 'hardhat/config';

// import type {} from './type-extensions.ts';

const hardhatTranspilerPlugin: HardhatPlugin = {
  id: 'hardhat-transpiler',
  tasks: [
    task('transpile', 'Transpile contracts.')
      // .addOption({
      //   name: "who",
      //   description: "Who is receiving the greeting.",
      //   type: ArgumentType.STRING,
      //   defaultValue: "Hardhat",
      // })
      .setAction(() => import('./tasks/transpile.ts'))
      .build(),
  ],
  npmPackage: null,
};

export default hardhatTranspilerPlugin;
