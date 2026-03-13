const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const shouldBehaveLikeProxy = require('../Proxy.behaviour');

const fixture = async () => {
  const [nonContractAddress] = await ethers.getSigners();

  const implementation = await ethers.deployContract('DummyImplementation');

  return { nonContractAddress, implementation };
};

describe('ERC1967Proxy', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('(default) allowUninitialized is false', function () {
    before(function () {
      this.createProxy = (implementation, initData, opts) =>
        ethers.deployContract('ERC1967Proxy', [implementation, initData], opts);
    });

    shouldBehaveLikeProxy({ allowUninitialized: false });
  });

  describe('(unsafe) allowUninitialized is true', function () {
    before(function () {
      this.createProxy = (implementation, initData, opts) =>
        ethers.deployContract('ERC1967ProxyUnsafe', [implementation, initData], opts);
    });

    shouldBehaveLikeProxy({ allowUninitialized: true });
  });
});
