const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { shouldBehaveLikeNonces } = require('./Nonces.behavior');

async function fixture() {
  const mock = await ethers.deployContract('$Nonces');
  return { mock };
}

describe('Nonces', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeNonces();
});
