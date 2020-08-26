const { accounts, contract } = require('@openzeppelin/test-environment');

const shouldBehaveLikeUpgradeabilityProxy = require('./UpgradeabilityProxy.behaviour');
const shouldBehaveLikeTransparentUpgradeableProxy = require('./TransparentUpgradeableProxy.behaviour');

const TransparentUpgradeableProxy = contract.fromArtifact('TransparentUpgradeableProxy');

describe('TransparentUpgradeableProxy', function () {
  const [proxyAdminAddress, proxyAdminOwner] = accounts;

  const createProxy = async function (logic, admin, initData, opts) {
    return TransparentUpgradeableProxy.new(logic, admin, initData, opts);
  };

  shouldBehaveLikeUpgradeabilityProxy(createProxy, proxyAdminAddress, proxyAdminOwner);
  shouldBehaveLikeTransparentUpgradeableProxy(createProxy, accounts);
});
