import type { HardhatRuntimeEnvironmentHooks, HookContext } from 'hardhat/types/hooks';
import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import type { ArtifactManager } from 'hardhat/types/artifacts';

const suffixes = ['UpgradeableWithInit', 'Upgradeable'];

const overrideReadArtifact =
  (artifactExists: ArtifactManager['artifactExists'], runSuper: ArtifactManager['readArtifact']) =>
  <ContractNameT extends string>(contractNameOrFullyQualifiedName: ContractNameT) =>
    suffixes
      .map(suffix => contractNameOrFullyQualifiedName + suffix)
      .reduce<Promise<string | false | undefined>>(
        (acc, artifactWithSuffix) =>
          acc.then(result => result || artifactExists(artifactWithSuffix).then(exists => exists && artifactWithSuffix)),
        Promise.resolve(undefined),
      )
      .then(artifactWithSuffix => runSuper((artifactWithSuffix || contractNameOrFullyQualifiedName) as ContractNameT));

export default async (): Promise<Partial<HardhatRuntimeEnvironmentHooks>> => ({
  created: async (context: HookContext, hre: HardhatRuntimeEnvironment): Promise<void> => {
    hre.artifacts.readArtifact = overrideReadArtifact(
      hre.artifacts.artifactExists.bind(hre.artifacts),
      hre.artifacts.readArtifact.bind(hre.artifacts),
    );
  },
});
