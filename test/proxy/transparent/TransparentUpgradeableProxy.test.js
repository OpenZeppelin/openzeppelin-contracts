const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const shouldBehaveLikeProxy = require('../Proxy.behaviour');
const shouldBehaveLikeTransparentUpgradeableProxy = require('./TransparentUpgradeableProxy.behaviour');

async function fixture() {
  const [owner, other, ...accounts] = await ethers.getSigners();

  const createProxy = function (logic, initData, opts = undefined) {
    return ethers.deployContract('TransparentUpgradeableProxy', [logic, owner, initData], opts);
  };

  return { owner, other, accounts, createProxy };
}

describe('TransparentUpgradeableProxy', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeProxy();

  // createProxy, owner, otherAccounts
  shouldBehaveLikeTransparentUpgradeableProxy();
});
