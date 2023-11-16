const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const shouldBehaveLikeProxy = require('../Proxy.behaviour');
const shouldBehaveLikeTransparentUpgradeableProxy = require('./TransparentUpgradeableProxy.behaviour');

async function fixture() {
  const [owner, anotherAccount, ...otherAccounts] = await ethers.getSigners();

  const createProxy = function (logic, initData, opts = undefined) {
    return ethers.deployContract(
      'TransparentUpgradeableProxy',
      [logic, owner, initData],
      opts,
    );
  };

  return { owner, anotherAccount, otherAccounts, createProxy };
}

describe.only('TransparentUpgradeableProxy', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeProxy();

  describe.skip('', function () {
    // createProxy, owner, otherAccounts
    shouldBehaveLikeTransparentUpgradeableProxy();
  });
});
