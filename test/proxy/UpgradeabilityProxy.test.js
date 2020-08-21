const { accounts, contract } = require('@openzeppelin/test-environment');

const shouldBehaveLikeUpgradeabilityProxy = require('./UpgradeabilityProxy.behaviour');

const UpgradeabilityProxy = contract.fromArtifact('UpgradeabilityProxy');

const IMPLEMENTATION_LABEL = 'eip1967.proxy.implementation';

describe('UpgradeabilityProxy', function () {
  const [proxyAdminOwner] = accounts;

  const createProxy = async function (implementation, _admin, initData, opts) {
    return UpgradeabilityProxy.new(implementation, initData, opts);
  };

  shouldBehaveLikeUpgradeabilityProxy(createProxy, undefined, proxyAdminOwner);
});
