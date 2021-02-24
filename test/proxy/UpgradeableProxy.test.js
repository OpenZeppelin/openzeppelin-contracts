const shouldBehaveLikeProxy = require('./Proxy.behaviour');

const UpgradeableProxy = artifacts.require('UpgradeableProxy');

contract('UpgradeableProxy', function (accounts) {
  const [proxyAdminOwner] = accounts;

  const createProxy = async function (implementation, _admin, initData, opts) {
    return UpgradeableProxy.new(implementation, initData, opts);
  };

  shouldBehaveLikeProxy(createProxy, undefined, proxyAdminOwner);
});
