const { HardhatError } = require('hardhat/internal/core/errors');

function isExpectedError(e, suffix) {
  // HH700: Artifact not found - from https://hardhat.org/hardhat-runner/docs/errors#HH700
  return HardhatError.isHardhatError(e) && e.number === 700 && suffix !== '';
}

// Modifies the artifact require functions so that instead of X it loads the XUpgradeable contract.
// This allows us to run the same test suite on both the original and the transpiled and renamed Upgradeable contracts.
extendEnvironment(env => {
  const suffixes = ['UpgradeableWithInit', 'Upgradeable', ''];

  // Truffe (deprecated)
  const originalRequire = env.artifacts.require;
  env.artifacts.require = function (name) {
    for (const suffix of suffixes) {
      try {
        return originalRequire.call(this, name + suffix);
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

  // Ethers
  const originalReadArtifact = env.artifacts.readArtifact;
  env.artifacts.readArtifact = async function (name) {
    for (const suffix of suffixes) {
      try {
        return await originalReadArtifact.call(this, name + suffix);
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
});
