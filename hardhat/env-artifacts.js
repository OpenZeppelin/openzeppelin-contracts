const { HardhatError } = require('hardhat/internal/core/errors');

// Modifies `artifacts.require(X)` so that instead of X it loads the XUpgradeable contract.
// This allows us to run the same test suite on both the original and the transpiled and renamed Upgradeable contracts.

extendEnvironment(env => {
  const artifactsRequire = env.artifacts.require;

  env.artifacts.require = name => {
    for (const suffix of ['UpgradeableWithInit', 'Upgradeable', '']) {
      try {
        return artifactsRequire(name + suffix);
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
});
