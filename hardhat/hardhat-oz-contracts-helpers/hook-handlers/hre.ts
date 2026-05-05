import { HardhatError } from '@nomicfoundation/hardhat-errors';
import type { HardhatRuntimeEnvironmentHooks, HookContext } from 'hardhat/types/hooks';
import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import type { ArtifactManager } from 'hardhat/types/artifacts';

const suffixes = ['UpgradeableWithInit', 'Upgradeable'];

const overrideReadArtifact =
  (artifactExists: ArtifactManager['artifactExists'], runSuper: ArtifactManager['readArtifact']) =>
  async <ContractNameT extends string>(contractNameOrFullyQualifiedName: ContractNameT) => {
    for (const suffix of suffixes) {
      const artifactWithSuffix = contractNameOrFullyQualifiedName + suffix;
      if (await artifactExists(artifactWithSuffix)) {
        return await runSuper(artifactWithSuffix as ContractNameT);
      }
    }

    return await runSuper(contractNameOrFullyQualifiedName as ContractNameT);
  };

export default async (): Promise<Partial<HardhatRuntimeEnvironmentHooks>> => ({
  created: async (context: HookContext, hre: HardhatRuntimeEnvironment): Promise<void> => {
    hre.artifacts.readArtifact = overrideReadArtifact(
      hre.artifacts.artifactExists.bind(hre.artifacts),
      hre.artifacts.readArtifact.bind(hre.artifacts),
    );
  },
});
