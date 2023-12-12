const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeERC20Capped } = require('./ERC20Capped.behavior');

const name = 'My Token';
const symbol = 'MTKN';
const cap = 1000n;

async function fixture() {
  const [user] = await ethers.getSigners();

  const token = await ethers.deployContract('$ERC20Capped', [name, symbol, cap]);

  return { user, token, cap };
}

describe('ERC20Capped', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('requires a non-zero cap', async function () {
    const ERC20Capped = await ethers.getContractFactory('$ERC20Capped');

    await expect(ERC20Capped.deploy(name, symbol, 0))
      .to.be.revertedWithCustomError(ERC20Capped, 'ERC20InvalidCap')
      .withArgs(0);
  });

  shouldBehaveLikeERC20Capped();
});
