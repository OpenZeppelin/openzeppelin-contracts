const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { shouldBehaveLikeNonces, shouldBehaveLikeNoncesKeyed } = require('./Nonces.behavior');

async function fixture() {
  const mock = await ethers.deployContract('$NoncesKeyed');
  return { mock };
}

describe('NoncesKeyed', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeNonces();
  shouldBehaveLikeNoncesKeyed();
});
