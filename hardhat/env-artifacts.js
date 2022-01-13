const { HardhatError } = require('hardhat/internal/core/errors');

extendEnvironment(env => {
  const artifactsRequire = env.artifacts.require;

  env.artifacts.require = (name) => {
    for (const suffix of ['UpgradeableWithInit', 'Upgradeable', '']) {
      try {
        return artifactsRequire(name + suffix);
      } catch (e) {
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
