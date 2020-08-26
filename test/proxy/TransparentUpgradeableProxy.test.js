const { accounts, contract } = require('@openzeppelin/test-environment');

const shouldBehaveLikeUpgradeableProxy = require('./UpgradeableProxy.behaviour');
const shouldBehaveLikeTransparentUpgradeableProxy = require('./TransparentUpgradeableProxy.behaviour');

const TransparentUpgradeableProxy = contract.fromArtifact('TransparentUpgradeableProxy');

describe('TransparentUpgradeableProxy', function () {
  const [proxyAdminAddress, proxyAdminOwner] = accounts;

  const createProxy = async function (logic, admin, initData, opts) {
    return TransparentUpgradeableProxy.new(logic, admin, initData, opts);
  };

  shouldBehaveLikeUpgradeableProxy(createProxy, proxyAdminAddress, proxyAdminOwner);
  shouldBehaveLikeTransparentUpgradeableProxy(createProxy, accounts);
});
