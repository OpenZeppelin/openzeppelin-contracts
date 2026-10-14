import type { CompilationJob, SolidityBuildInfo } from 'hardhat/types/solidity';

export async function compilationJobToAstOnlyBuildInfo(compilationJob: CompilationJob): Promise<SolidityBuildInfo> {
  const originalBuildId = await compilationJob.getBuildId();
  const originalSolcInput = await compilationJob.getSolcInput();

  return {
    _format: 'hh3-sol-build-info-1',
    id: originalBuildId + '-ast-only',
    solcVersion: compilationJob.solcConfig.version,
    solcLongVersion: compilationJob.solcLongVersion,
    input: {
      ...originalSolcInput,
      settings: {
        ...originalSolcInput.settings,
        optimizer: { enabled: false },
        outputSelection: {
          '*': {
            '': ['ast'],
          },
        },
      },
    },
    userSourceNameMap: compilationJob.dependencyGraph.getRootsUserSourceNameMap(),
  };
}
