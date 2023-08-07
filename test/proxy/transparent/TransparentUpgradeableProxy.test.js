const shouldBehaveLikeProxy = require('../Proxy.behaviour');
const shouldBehaveLikeTransparentUpgradeableProxy = require('./TransparentUpgradeableProxy.behaviour');

const TransparentUpgradeableProxy = artifacts.require('TransparentUpgradeableProxy');
const ITransparentUpgradeableProxy = artifacts.require('ITransparentUpgradeableProxy');

contract('TransparentUpgradeableProxy', function (accounts) {
  const [owner, ...otherAccounts] = accounts;

  // `undefined`, `null` and other false-ish opts will not be forwarded.
  const createProxy = async function (logic, initData, opts = undefined) {
    const { address, transactionHash } = await TransparentUpgradeableProxy.new(
      logic,
      owner,
      initData,
      ...[opts].filter(Boolean),
    );
    const instance = await ITransparentUpgradeableProxy.at(address);
    return { ...instance, transactionHash };
  };

  shouldBehaveLikeProxy(createProxy, otherAccounts);
  shouldBehaveLikeTransparentUpgradeableProxy(createProxy, owner, otherAccounts);
});
