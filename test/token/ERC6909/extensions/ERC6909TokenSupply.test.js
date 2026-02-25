const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeERC6909 } = require('../ERC6909.behavior');
const { shouldSupportInterfaces } = require('../../../utils/introspection/SupportsInterface.behavior');

async function fixture() {
  const [holder, operator, recipient, other] = await ethers.getSigners();
  const token = await ethers.deployContract('$ERC6909TokenSupply');
  return { token, holder, operator, recipient, other };
}

describe('ERC6909TokenSupply', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeERC6909();

  describe('totalSupply', function () {
    it('is zero before any mint', async function () {
      await expect(this.token.totalSupply(1n)).to.eventually.be.equal(0n);
    });

    it('minting tokens increases the total supply', async function () {
      await this.token.$_mint(this.holder, 1n, 17n);
      await expect(this.token.totalSupply(1n)).to.eventually.be.equal(17n);
    });

    describe('with tokens minted', function () {
      const supply = 1000n;

      beforeEach(async function () {
        await this.token.$_mint(this.holder, 1n, supply);
      });

      it('burning tokens decreases the total supply', async function () {
        await this.token.$_burn(this.holder, 1n, 17n);
        await expect(this.token.totalSupply(1n)).to.eventually.be.equal(supply - 17n);
      });

      it('supply unaffected by transfers', async function () {
        await this.token.$_transfer(this.holder, this.recipient, 1n, 42n);
        await expect(this.token.totalSupply(1n)).to.eventually.be.equal(supply);
      });

      it('supply unaffected by no-op', async function () {
        await this.token.$_update(ethers.ZeroAddress, ethers.ZeroAddress, 1n, 42n);
        await expect(this.token.totalSupply(1n)).to.eventually.be.equal(supply);
      });
    });
  });

  shouldSupportInterfaces(['ERC6909', 'ERC6909TokenSupply']);
});
