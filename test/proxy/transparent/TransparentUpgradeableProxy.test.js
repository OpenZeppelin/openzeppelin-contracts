const shouldBehaveLikeProxy = require('../Proxy.behaviour');
const shouldBehaveLikeTransparentUpgradeableProxy = require('./TransparentUpgradeableProxy.behaviour');

const TransparentUpgradeableProxy = artifacts.require('TransparentUpgradeableProxy');
const ITransparentUpgradeableProxy = artifacts.require('ITransparentUpgradeableProxy');

contract('TransparentUpgradeableProxy', function (accounts) {
  const createProxy = async function (logic, owner, initData, opts = {}) {
    const { address, transactionHash } = await TransparentUpgradeableProxy.new(logic, owner, initData, opts);
    const instance = await ITransparentUpgradeableProxy.at(address);
    return { ...instance, transactionHash };
  };

  shouldBehaveLikeProxy(createProxy, accounts);
  shouldBehaveLikeTransparentUpgradeableProxy(createProxy, accounts);
});
