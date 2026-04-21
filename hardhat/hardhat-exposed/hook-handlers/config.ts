import path from 'node:path';

import type { ConfigHooks } from 'hardhat/types/hooks';

export type * from '../type-extensions.ts';

export default async (): Promise<Partial<ConfigHooks>> => ({
  validateUserConfig: async userConfig => {
    const results: Array<{ path: string[]; message: string }> = [];

    if (userConfig.exposed?.prefix !== undefined && typeof userConfig.exposed?.prefix !== 'string') {
      results.push({ path: ['exposed', 'prefix'], message: 'Expected an optional string.' });
    }
    if (
      userConfig.exposed?.exclude !== undefined &&
      (!Array.isArray(userConfig.exposed.exclude) || userConfig.exposed.exclude.some(e => typeof e !== 'string'))
    ) {
      results.push({ path: ['exposed', 'exclude'], message: 'Expected an optional string[].' });
    }
    if (
      userConfig.exposed?.include !== undefined &&
      (!Array.isArray(userConfig.exposed.include) || userConfig.exposed.include.some(e => typeof e !== 'string'))
    ) {
      results.push({ path: ['exposed', 'include'], message: 'Expected an optional string[].' });
    }
    if (userConfig.exposed?.outDir !== undefined && typeof userConfig.exposed?.outDir !== 'string') {
      results.push({ path: ['exposed', 'outDir'], message: 'Expected an optional string.' });
    }
    if (userConfig.exposed?.initializers !== undefined && typeof userConfig.exposed?.initializers !== 'boolean') {
      results.push({ path: ['exposed', 'initializers'], message: 'Expected an optional boolean.' });
    }
    return results;
  },

  resolveUserConfig: (userConfig, resolveConfigurationVariable, next) =>
    next(userConfig, resolveConfigurationVariable).then(partiallyResolvedConfig => {
      const makeAbsolutePath = (p: string) =>
        path.isAbsolute(p) ? p : path.resolve(partiallyResolvedConfig.paths.root, p);
      const outDir = makeAbsolutePath(userConfig.exposed?.outDir ?? 'contracts-exposed');
      return {
        ...partiallyResolvedConfig,
        paths: {
          ...partiallyResolvedConfig.paths,
          sources: {
            ...partiallyResolvedConfig.paths.sources,
            solidity: [...partiallyResolvedConfig.paths.sources.solidity, outDir],
          },
        },
        exposed: {
          prefix: userConfig.exposed?.prefix ?? '$',
          exclude: (userConfig.exposed?.exclude ?? []).map(makeAbsolutePath),
          include: (userConfig.exposed?.include ?? ['**/*']).map(makeAbsolutePath),
          outDir,
          initializers: userConfig.exposed?.initializers ?? false,
        },
      };
    }),
});
