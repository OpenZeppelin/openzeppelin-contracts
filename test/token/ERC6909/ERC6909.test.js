const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeERC6909 } = require('./ERC6909.behavior');
const { expect } = require('chai');

async function fixture() {
  const [operator, holder, ...otherAccounts] = await ethers.getSigners();
  const token = await ethers.deployContract('$ERC6909');
  return { token, operator, holder, otherAccounts };
}

describe('ERC6909', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeERC6909();

  describe('internal functions', function () {
    const tokenId = 1990n;
    const mintValue = 9001n;
    const burnValue = 3000n;

    describe('_mint', function () {
      it('reverts with a zero destination address', async function () {
        await expect(this.token.$_mint(ethers.ZeroAddress, tokenId, mintValue))
          .to.be.revertedWithCustomError(this.token, 'ERC6909InvalidReceiver')
          .withArgs(ethers.ZeroAddress);
      });

      describe('with minted tokens', function () {
        beforeEach(async function () {
          this.tx = await this.token.connect(this.operator).$_mint(this.holder, tokenId, mintValue);
        });

        it('emits a Transfer event from 0 address', async function () {
          await expect(this.tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.operator, ethers.ZeroAddress, this.holder, tokenId, mintValue);
        });

        it('credits the minted token value', async function () {
          await expect(this.token.balanceOf(this.holder, tokenId)).to.eventually.be.equal(mintValue);
        });
      });
    });

    describe('_burn', function () {
      it('reverts with a zero from address', async function () {
        await expect(this.token.$_burn(ethers.ZeroAddress, tokenId, burnValue))
          .to.be.revertedWithCustomError(this.token, 'ERC6909InvalidSender')
          .withArgs(ethers.ZeroAddress);
      });

      describe('with burned tokens', function () {
        beforeEach(async function () {
          await this.token.connect(this.operator).$_mint(this.holder, tokenId, mintValue);
          this.tx = await this.token.connect(this.operator).$_burn(this.holder, tokenId, burnValue);
        });

        it('emits a Transfer event to 0 address', async function () {
          await expect(this.tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.operator, this.holder, ethers.ZeroAddress, tokenId, burnValue);
        });

        it('debits the burned token value', async function () {
          await expect(this.token.balanceOf(this.holder, tokenId)).to.eventually.be.equal(mintValue - burnValue);
        });
      });
    });

    it('reverts when transferring from the zero address', async function () {
      await expect(this.token.$_transfer(ethers.ZeroAddress, this.holder, 1n, 1n))
        .to.be.revertedWithCustomError(this.token, 'ERC6909InvalidSender')
        .withArgs(ethers.ZeroAddress);
    });
  });
});