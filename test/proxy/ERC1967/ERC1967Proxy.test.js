const { ethers } = require('hardhat');

const shouldBehaveLikeProxy = require('../Proxy.behaviour');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const fixture = async () => {
  const [nonContractAddress] = await ethers.getSigners();

  const implementation = await ethers.deployContract('DummyImplementation');

  const createProxy = (implementation, initData, opts) =>
    ethers.deployContract('ERC1967Proxy', [implementation, initData], opts);

  return { nonContractAddress, implementation, createProxy };
};

describe('ERC1967Proxy', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeProxy();
});
