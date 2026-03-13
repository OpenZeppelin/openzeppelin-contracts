const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { shouldBehaveLikeERC6909 } = require('../ERC6909.behavior');

async function fixture() {
  const [holder, operator, recipient, other] = await ethers.getSigners();
  const token = await ethers.deployContract('$ERC6909Pausable');
  return { token, holder, operator, recipient, other };
}

describe('ERC6909Pausable', function () {
  const firstTokenId = 37n;
  const firstTokenValue = 42n;
  const secondTokenId = 19842n;
  const secondTokenValue = 23n;

  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeERC6909();

  describe('when token is paused', function () {
    beforeEach(async function () {
      await this.token.connect(this.holder).setOperator(this.operator, true);
      await this.token.$_mint(this.holder, firstTokenId, firstTokenValue);
      await this.token.$_pause();
    });

    it('reverts when trying to transfer', async function () {
      await expect(
        this.token.connect(this.holder).transfer(this.recipient, firstTokenId, firstTokenValue),
      ).to.be.revertedWithCustomError(this.token, 'EnforcedPause');
    });

    it('reverts when trying to transferFrom from operator', async function () {
      await expect(
        this.token.connect(this.operator).transferFrom(this.holder, this.recipient, firstTokenId, firstTokenValue),
      ).to.be.revertedWithCustomError(this.token, 'EnforcedPause');
    });

    it('reverts when trying to mint', async function () {
      await expect(this.token.$_mint(this.holder, secondTokenId, secondTokenValue)).to.be.revertedWithCustomError(
        this.token,
        'EnforcedPause',
      );
    });

    it('reverts when trying to burn', async function () {
      await expect(this.token.$_burn(this.holder, firstTokenId, firstTokenValue)).to.be.revertedWithCustomError(
        this.token,
        'EnforcedPause',
      );
    });

    describe('setOperator', function () {
      it('approves an operator', async function () {
        await this.token.connect(this.holder).setOperator(this.other, true);
        expect(await this.token.isOperator(this.holder, this.other)).to.be.true;
      });

      it('disapproves an operator', async function () {
        await this.token.connect(this.holder).setOperator(this.other, false);
        expect(await this.token.isOperator(this.holder, this.other)).to.be.false;
      });
    });

    describe('balanceOf', function () {
      it('returns the token value owned by the given address', async function () {
        expect(await this.token.balanceOf(this.holder, firstTokenId)).to.equal(firstTokenValue);
      });
    });

    describe('isOperator', function () {
      it('returns the approval of the operator', async function () {
        expect(await this.token.isOperator(this.holder, this.operator)).to.be.true;
      });
    });
  });
});
