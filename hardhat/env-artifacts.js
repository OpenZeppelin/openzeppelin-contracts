const { HardhatError } = require('hardhat/internal/core/errors');

// Extends a require artifact function to try with the Upgradeable variants.
function tryRequireUpgradableVariantsWith(originalRequire) {
  return function (name) {
    for (const suffix of ['UpgradeableWithInit', 'Upgradeable', '']) {
      try {
        return originalRequire.call(this, name + suffix);
      } catch (e) {
        // HH700: Artifact not found - from https://hardhat.org/hardhat-runner/docs/errors#HH700
        if (HardhatError.isHardhatError(e) && e.number === 700 && suffix !== '') {
          continue;
        } else {
          throw e;
        }
      }
    }
    throw new Error('Unreachable');
  };
}

// Modifies the artifact require functions so that instead of X it loads the XUpgradeable contract.
// This allows us to run the same test suite on both the original and the transpiled and renamed Upgradeable contracts.
extendEnvironment(env => {
  for (const require of [
    'require', // Truffle (Deprecated)
    'readArtifact', // Ethers
  ]) {
    env.artifacts[require] = tryRequireUpgradableVariantsWith(env.artifacts[require]);
  }
});
