const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const shouldBehaveLikeProxy = require('../Proxy.behaviour');
const shouldBehaveLikeTransparentUpgradeableProxy = require('./TransparentUpgradeableProxy.behaviour');

describe('TransparentUpgradeableProxy', function () {
  describe('(default) deploy ProxyAdmin', function () {
    async function fixture() {
      const [owner, other, ...accounts] = await ethers.getSigners();

      const implementation = await ethers.deployContract('DummyImplementation');

      const createProxy = function (logic, initData, opts = undefined) {
        return ethers.deployContract('TransparentUpgradeableProxy', [logic, owner, initData], opts);
      };

      return { nonContractAddress: owner, owner, other, accounts, implementation, createProxy };
    }

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikeProxy();

    // createProxy, owner, accounts
    shouldBehaveLikeTransparentUpgradeableProxy();
  });

  describe('(existing admin)', function () {
    async function fixture() {
      const [owner, other, ...accounts] = await ethers.getSigners();

      const implementation = await ethers.deployContract('DummyImplementation');
      const proxyAdmin = await ethers.deployContract('ProxyAdmin', [owner]);

      const createProxy = function (logic, initData, opts = undefined) {
        return ethers.deployContract('TransparentUpgradeableProxyExistingAdmin', [logic, proxyAdmin, initData], opts);
      };

      return { nonContractAddress: owner, owner, other, accounts, implementation, proxyAdmin, createProxy };
    }

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikeProxy();

    // createProxy, owner, accounts, proxyAdmin
    shouldBehaveLikeTransparentUpgradeableProxy({ deployProxyAdmin: false });
  });
});
