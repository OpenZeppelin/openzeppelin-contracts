const shouldBehaveLikeProxy = require('../Proxy.behaviour');

const UUPSProxy = artifacts.require('UUPSProxy');

contract('UUPSProxy', function (accounts) {
  const [proxyAdminOwner] = accounts;

  const createProxy = async function (implementation, _admin, initData, opts) {
    return UUPSProxy.new(implementation, initData, opts);
  };

  shouldBehaveLikeProxy(createProxy, undefined, proxyAdminOwner);
});
