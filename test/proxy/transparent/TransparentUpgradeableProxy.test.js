const shouldBehaveLikeProxy = require('../Proxy.behaviour');
const shouldBehaveLikeTransparentUpgradeableProxy = require('./TransparentUpgradeableProxy.behaviour');

const TransparentUpgradeableProxy = artifacts.require('TransparentUpgradeableProxy');

contract('TransparentUpgradeableProxy', function (accounts) {
  const [proxyAdminAddress, proxyAdminOwner] = accounts;

  const createProxy = async function (logic, admin, initData, opts) {
    return TransparentUpgradeableProxy.new(logic, admin, initData, opts);
  };

  shouldBehaveLikeProxy(createProxy, proxyAdminAddress, proxyAdminOwner);
  shouldBehaveLikeTransparentUpgradeableProxy(createProxy, accounts);
});
