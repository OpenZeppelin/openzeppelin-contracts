const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeERC6909 } = require('./ERC6909.behavior');

async function fixture() {
  const [operator, holder, ...otherAccounts] = await ethers.getSigners();
  const token = await ethers.deployContract('$ERC6909');
  return { token, operator, holder, otherAccounts };
}

describe.only('ERC6909', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeERC6909();
});
