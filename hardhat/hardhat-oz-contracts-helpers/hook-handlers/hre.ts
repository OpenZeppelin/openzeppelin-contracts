import { HardhatError } from '@nomicfoundation/hardhat-errors';
import type { HardhatRuntimeEnvironmentHooks, HookContext } from 'hardhat/types/hooks';
import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import type { ArtifactManager } from 'hardhat/types/artifacts';

const suffixes = ['UpgradeableWithInit', 'Upgradeable', ''];

function isExpectedError(e: unknown, suffix: string): boolean {
  return HardhatError.isHardhatError(e) && e.number === 1000 && suffix !== '';
}

const overrideReadArtifact =
  (runSuper: ArtifactManager['readArtifact']) =>
  async <ContractNameT extends string>(contractNameOrFullyQualifiedName: ContractNameT) => {
    for (const suffix of suffixes) {
      try {
        return await runSuper((contractNameOrFullyQualifiedName + suffix) as ContractNameT);
      } catch (e) {
        if (isExpectedError(e, suffix)) {
          continue;
        } else {
          throw e;
        }
      }
    }
    throw new Error('Unreachable');
  };

export default async (): Promise<Partial<HardhatRuntimeEnvironmentHooks>> => ({
  created: async (context: HookContext, hre: HardhatRuntimeEnvironment): Promise<void> => {
    hre.artifacts.readArtifact = overrideReadArtifact(hre.artifacts.readArtifact.bind(hre.artifacts));
  },
});
