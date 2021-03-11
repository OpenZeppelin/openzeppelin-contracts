const shouldBehaveLikeProxy = require('../Proxy.behaviour');

const SimpleProxy = artifacts.require('SimpleProxy');

contract('SimpleProxy', function (accounts) {
  const [proxyAdminOwner] = accounts;

  const createProxy = async function (implementation, _admin, initData, opts) {
    return SimpleProxy.new(implementation, initData, opts);
  };

  shouldBehaveLikeProxy(createProxy, undefined, proxyAdminOwner);
});
