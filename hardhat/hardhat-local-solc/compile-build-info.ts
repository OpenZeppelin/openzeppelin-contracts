import type { HookContext } from 'hardhat/types/hooks';
import type { CompilerOutput, SolidityBuildInfo, SolidityCompilerConfig } from 'hardhat/types/solidity';

// `solidity.compileBuildInfo` always downloads the solc version recorded in the build info, ignoring the `path` of
// local binaries. Those are compiled through the `getCompiler` hook instead (see `./hook-handlers/solidity.ts`).
export async function compileBuildInfo(
  context: Pick<HookContext, 'hooks' | 'solidity'>,
  buildInfo: SolidityBuildInfo,
  solcConfig: SolidityCompilerConfig,
  options?: { quiet?: boolean },
): Promise<CompilerOutput> {
  if (!('path' in solcConfig) || solcConfig.path === undefined) {
    return context.solidity.compileBuildInfo(buildInfo, options);
  }
  const compiler = await context.hooks.runHandlerChain('solidity', 'getCompiler', [solcConfig], async () => {
    throw new Error(`No getCompiler hook handled the local solc binary ${solcConfig.path}`);
  });
  return compiler.compile(buildInfo.input);
}
