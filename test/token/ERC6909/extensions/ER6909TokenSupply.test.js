const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');

const { shouldBehaveLikeERC6909 } = require('../ERC6909.behavior');

async function fixture() {
  const [operator, holder, ...otherAccounts] = await ethers.getSigners();
  const token = await ethers.deployContract('$ER6909TokenSupply');
  return { token, operator, holder, otherAccounts };
}

describe('ERC6909TokenSupply', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeERC6909();

  describe('totalSupply', function () {
    beforeEach(async function () {
      await this.token.$_mint(this.holder, 1n, 1000n);
    });

    it('minting tokens increases the total supply', async function () {
      return expect(this.token.totalSupply(1n)).to.eventually.be.equal(1000n);
    });

    it('burning tokens decreases the total supply', async function () {
      await this.token.$_burn(this.holder, 1n, 500n);
      return expect(this.token.totalSupply(1n)).to.eventually.be.equal(500n);
    });
  });
});
