import path from 'path';
import type { HardhatConfig, HardhatUserConfig, ConfigurationVariableResolver } from 'hardhat/types/config';
import type { ConfigHooks } from 'hardhat/types/hooks';

export default async (): Promise<Partial<ConfigHooks>> => ({
  resolveUserConfig: (
    userConfig: HardhatUserConfig,
    resolveConfigurationVariable: ConfigurationVariableResolver,
    next: (
      nextUserConfig: HardhatUserConfig,
      nextResolveConfigurationVariable: ConfigurationVariableResolver,
    ) => Promise<HardhatConfig>,
  ): Promise<HardhatConfig> =>
    next(userConfig, resolveConfigurationVariable).then((resolvedConfig: HardhatConfig) => {
      resolvedConfig.exposed = {
        ...userConfig.exposed,
        exclude: userConfig.exposed?.exclude ?? [],
        include: userConfig.exposed?.include ?? ['**/*'],
        outDir: userConfig.exposed?.outDir ?? 'contracts-exposed',
      };
      // Add exposed contracts path to Solidity sources, and exclude them from further processing
      resolvedConfig.exposed.exclude.push(path.join(resolvedConfig.exposed.outDir, "**", "*"));
      resolvedConfig.paths.sources.solidity.push(path.join(resolvedConfig.paths.root, resolvedConfig.exposed.outDir));
      return resolvedConfig;
    }),
});
