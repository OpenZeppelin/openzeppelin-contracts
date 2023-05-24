const { internalTask } = require('hardhat/config');
const { TASK_TEST_GET_TEST_FILES } = require('hardhat/builtin-tasks/task-names');

// Modifies `hardhat test` to skip the proxy tests after proxies are removed by the transpiler for upgradeability.

internalTask(TASK_TEST_GET_TEST_FILES).setAction(async (args, hre, runSuper) => {
  const path = require('path');
  const { promises: fs } = require('fs');

  const hasProxies = await fs
    .access(path.join(hre.config.paths.sources, 'proxy/Proxy.sol'))
    .then(() => true)
    .catch(() => false);

  const ignoredIfProxy = [
    'proxy/beacon/BeaconProxy.test.js',
    'proxy/beacon/UpgradeableBeacon.test.js',
    'proxy/ERC1967/ERC1967Proxy.test.js',
    'proxy/transparent/ProxyAdmin.test.js',
    'proxy/transparent/TransparentUpgradeableProxy.test.js',
    'proxy/utils/UUPSUpgradeable.test.js',
  ].map(p => path.join(hre.config.paths.tests, p));

  return (await runSuper(args)).filter(file => hasProxies || !ignoredIfProxy.includes(file));
});
