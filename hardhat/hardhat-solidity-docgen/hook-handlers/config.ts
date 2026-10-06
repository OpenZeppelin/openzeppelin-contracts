import path from 'node:path';

import type { ConfigHooks } from 'hardhat/types/hooks';
import { defaults } from '../internal/config.ts';

export type * from '../type-extensions.ts';

export default async (): Promise<Partial<ConfigHooks>> => ({
  resolveUserConfig: (userConfig, resolveConfigurationVariable, next) =>
    next(userConfig, resolveConfigurationVariable).then(config => {
      const { root } = config.paths;
      return {
        ...config,
        docgen: {
          // Build a new object instead of mutating the shared `defaults` singleton or the
          // user-provided `docgen` object. Precedence, from lowest to highest: plugin defaults,
          // user configuration, anything already resolved by another config hook.
          ...defaults,
          ...userConfig.docgen,
          ...config.docgen,
          root,
          sourcesDir: path.relative(root, config.paths.sources.solidity[0]).split(path.sep).join(path.posix.sep),
        },
      };
    }),
});
