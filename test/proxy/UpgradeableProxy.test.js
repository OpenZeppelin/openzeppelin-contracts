const { accounts, contract } = require('@openzeppelin/test-environment');

const shouldBehaveLikeUpgradeableProxy = require('./UpgradeableProxy.behaviour');

const UpgradeableProxy = contract.fromArtifact('UpgradeableProxy');

describe('UpgradeableProxy', function () {
  const [proxyAdminOwner] = accounts;

  const createProxy = async function (implementation, _admin, initData, opts) {
    return UpgradeableProxy.new(implementation, initData, opts);
  };

  shouldBehaveLikeUpgradeableProxy(createProxy, undefined, proxyAdminOwner);
});
