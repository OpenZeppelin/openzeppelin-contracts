const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { shouldBehaveLikeNonces, shouldBehaveLikeNoncesSemiAbstracted } = require('./Nonces.behavior');

async function fixture() {
  const mock = await ethers.deployContract('$NoncesSemiAbstracted');
  return { mock };
}

describe('NoncesSemiAbstracted', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeNonces();
  shouldBehaveLikeNoncesSemiAbstracted();
});
