const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeERC20 } = require('../ERC20.behavior.js');

const name = 'My Token';
const symbol = 'MTKN';
const value = 1000n;

async function fixture() {
  // this.accounts is used by shouldBehaveLikeERC20
  const accounts = await ethers.getSigners();
  const [holder, recipient, other] = accounts;

  const token = await ethers.deployContract('$ERC7246', [name, symbol]);
  await token.$_mint(holder, value);

  return {
    accounts,
    holder,
    other,
    token,
    recipient,
  };
}

describe('ERC7246', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('encumber', function () {
    beforeEach(async function () {
      this.encumberAmount = 400n;
      await this.token.connect(this.holder).encumber(this.other, this.encumberAmount);
    });

    it('should reduce `availableBalanceOf`', async function () {
      await expect(this.token.availableBalanceOf(this.holder)).to.eventually.equal(value - this.encumberAmount);
    });

    it('should not reduce `balanceOf`', async function () {
      await expect(this.token.balanceOf(this.holder)).to.eventually.equal(value);
    });

    it('should update `encumbrances`', async function () {
      await expect(this.token.encumbrances(this.holder, this.other)).to.eventually.eq(this.encumberAmount);
    });

    it('should update `encumberedBalanceOf`', async function () {
      await expect(this.token.encumberedBalanceOf(this.holder)).to.eventually.eq(this.encumberAmount);
    });

    it('should revert if self encumbrance', async function () {
      await expect(this.token.connect(this.holder).encumber(this.holder, 1n)).to.be.revertedWithCustomError(
        this.token,
        'ERC7246SelfEncumbrance',
      );
    });

    it('should revert if encumbrance is over `availableBalanceOf`', async function () {
      const availableBalanceOf = value - this.encumberAmount;
      await expect(this.token.connect(this.holder).encumber(this.other, availableBalanceOf + 1n))
        .to.be.revertedWithCustomError(this.token, 'ERC7246InsufficientAvailableBalance')
        .withArgs(availableBalanceOf, availableBalanceOf + 1n);
    });

    it('should restrict `transfer` to available balance', async function () {
      await expect(this.token.connect(this.holder).transfer(this.other, value))
        .to.be.revertedWithCustomError(this.token, 'ERC7246InsufficientAvailableBalance')
        .withArgs(value - this.encumberAmount, value);
    });

    it('should restrict `transferFrom` to available balance', async function () {
      await this.token.connect(this.holder).approve(this.recipient, value);
      await this.token.connect(this.recipient).transferFrom(this.holder, this.recipient, value - this.encumberAmount);

      await expect(this.token.connect(this.recipient).transferFrom(this.holder, this.recipient, 1))
        .to.be.revertedWithCustomError(this.token, 'ERC7246InsufficientAvailableBalance')
        .withArgs(0, 1);
    });

    it('should allow transfer within available balance', async function () {
      await expect(this.token.connect(this.holder).transfer(this.other, value - 400n))
        .to.emit(this.token, 'Transfer')
        .withArgs(this.holder.address, this.other.address, value - 400n);
    });
  });

  describe('encumberFrom', function () {
    beforeEach(async function () {
      await this.token.connect(this.holder).approve(this.other, 100n);
      this.encumberTx = this.token.connect(this.other).encumberFrom(this.holder, this.other, 100n);
    });

    it('should increase `encumbrances`', async function () {
      await this.encumberTx;
      await expect(this.token.encumbrances(this.holder, this.other)).to.eventually.eq(100n);
    });

    it('should emit event', async function () {
      await expect(this.encumberTx).to.emit(this.token, 'Encumber').withArgs(this.holder, this.other, 100n);
    });

    it('should consume approval', async function () {
      await this.encumberTx;
      await expect(this.token.allowance(this.holder, this.other)).to.eventually.eq(0);
    });

    // Encumbrances can be forwarded--meaning an account with an encumbrance can give it to another account
    it('can forward encumbrance', async function () {
      await this.encumberTx;
      await expect(this.token.connect(this.other).encumberFrom(this.holder, this.recipient, 100n))
        .to.emit(this.token, 'Release')
        .withArgs(this.holder, this.other, 100n)
        .to.emit(this.token, 'Encumber')
        .withArgs(this.holder, this.recipient, 100n);

      await expect(this.token.encumbrances(this.holder, this.other)).to.eventually.eq(0);
      await expect(this.token.encumbrances(this.holder, this.recipient)).to.eventually.eq(100n);
    });
  });

  describe('release', function () {
    beforeEach(async function () {
      this.encumberAmount = 400n;
      this.releaseAmount = 100n;

      await this.token.connect(this.holder).encumber(this.other, this.encumberAmount);
      this.releaseTx = this.token.connect(this.other).release(this.holder, this.releaseAmount);
    });

    it('should emit event', async function () {
      await expect(this.releaseTx).to.emit(this.token, 'Release').withArgs(this.holder, this.other, this.releaseAmount);
    });

    it('should reduce `encumberedBalanceOf`', async function () {
      await this.releaseTx;
      await expect(this.token.encumberedBalanceOf(this.holder)).to.eventually.eq(
        this.encumberAmount - this.releaseAmount,
      );
    });

    it('should reduce `encumbrances`', async function () {
      await this.releaseTx;
      await expect(this.token.encumbrances(this.holder, this.other)).to.eventually.eq(
        this.encumberAmount - this.releaseAmount,
      );
    });

    it('should revert if above respective `encumbrance`', async function () {
      await this.releaseTx;
      const remainingEncumbrance = this.encumberAmount - this.releaseAmount;
      await expect(this.token.connect(this.other).release(this.holder, remainingEncumbrance + 1n))
        .to.be.revertedWithCustomError(this.token, 'ERC7246InsufficientEncumbrance')
        .withArgs(remainingEncumbrance, remainingEncumbrance + 1n);
    });
  });

  // This is the main expected flow for consuming encumbrances.
  describe('transferFrom', function () {
    beforeEach(async function () {
      this.encumberAmount = 400n;
      await this.token.connect(this.holder).encumber(this.other, this.encumberAmount);
    });

    it('should emit release event', async function () {
      await expect(this.token.connect(this.other).transferFrom(this.holder, this.recipient, this.encumberAmount))
        .to.emit(this.token, 'Release')
        .withArgs(this.holder, this.other, this.encumberAmount);
    });

    it('should decrease encumbrances', async function () {
      await this.token.connect(this.other).transferFrom(this.holder, this.recipient, this.encumberAmount - 100n);
      await expect(this.token.encumbrances(this.holder, this.other)).to.eventually.eq(100n);
    });

    it('should consume encumbrance first, then allowance', async function () {
      await this.token.connect(this.holder).approve(this.other, 200n);
      await expect(this.token.connect(this.other).transferFrom(this.holder, this.recipient, this.encumberAmount + 150n))
        .to.emit(this.token, 'Release')
        .withArgs(this.holder, this.other, this.encumberAmount);
      await expect(this.token.encumbrances(this.holder, this.other)).to.eventually.eq(0n);
      await expect(this.token.allowance(this.holder, this.other)).to.eventually.eq(50n);
    });
  });

  shouldBehaveLikeERC20(value);
});
