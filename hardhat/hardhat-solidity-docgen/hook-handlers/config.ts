import path from 'node:path';

import type { ConfigHooks } from 'hardhat/types/hooks';
import { defaults } from '../internal/config.ts';

export type * from '../type-extensions.ts';

export default async (): Promise<Partial<ConfigHooks>> => ({
  resolveUserConfig: (userConfig, resolveConfigurationVariable, next) =>
    next(userConfig, resolveConfigurationVariable).then(config => {
      config.docgen ??= userConfig.docgen ?? defaults;
      config.docgen.root = config.paths.root;
      config.docgen.sourcesDir = path
        .relative(config.paths.root, config.paths.sources.solidity[0]) // TODO: support multiple source directories
        .split(path.sep)
        .join(path.posix.sep);
      return config;
    }),
});
