const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeERC7540Redeem } = require('./ERC7540.behavior');
const { shouldSupportInterfaces } = require('../../../utils/introspection/SupportsInterface.behavior');

const REQUEST_ID = 0n;
const shareAmount = 1000n;
const assetAmount = 1000n;

async function fixture() {
  const [holder, operator, recipient, other] = await ethers.getSigners();
  const asset = await ethers.deployContract('$ERC20Mock');
  const token = await ethers.deployContract('$ERC7540Redeem', ['', '', asset]);
  return { token, asset, holder, operator, recipient, other };
}

describe('ERC7540Redeem', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeERC7540Redeem();

  describe('internal functions', function () {
    describe('_setPendingRedeem', function () {
      it('sets the pending redeem for a controller', async function () {
        await this.token.$_setPendingRedeem(this.holder, shareAmount);
        await expect(this.token.pendingRedeemRequest(REQUEST_ID, this.holder)).to.eventually.equal(shareAmount);
      });
    });

    describe('_setClaimableRedeem', function () {
      it('sets the claimable redeem for a controller', async function () {
        await this.token.$_setClaimableRedeem(this.holder, assetAmount, shareAmount);
        await expect(this.token.claimableRedeemRequestAssets(REQUEST_ID, this.holder)).to.eventually.equal(assetAmount);
        await expect(this.token.claimableRedeemRequest(REQUEST_ID, this.holder)).to.eventually.equal(shareAmount);
      });
    });
  });

  describe('requestRedeem with ERC-20 allowance', function () {
    beforeEach(async function () {
      await this.token.$_mint(this.holder, shareAmount);
      await this.asset.$_mint(this.token, assetAmount);
    });

    it('approved spender can request on behalf of owner', async function () {
      await this.token.connect(this.holder).approve(this.other, shareAmount);

      await expect(this.token.connect(this.other).requestRedeem(shareAmount, this.holder, this.holder))
        .to.emit(this.token, 'RedeemRequest')
        .withArgs(this.holder, this.holder, REQUEST_ID, this.other, shareAmount);

      await expect(this.token.pendingRedeemRequest(REQUEST_ID, this.holder)).to.eventually.equal(shareAmount);
    });

    it('consumes finite allowance', async function () {
      await this.token.connect(this.holder).approve(this.other, shareAmount);
      await this.token.connect(this.other).requestRedeem(shareAmount, this.holder, this.holder);

      await expect(this.token.allowance(this.holder, this.other)).to.eventually.equal(0n);
    });

    it('does not consume infinite allowance', async function () {
      await this.token.connect(this.holder).approve(this.other, ethers.MaxUint256);
      await this.token.connect(this.other).requestRedeem(shareAmount, this.holder, this.holder);

      await expect(this.token.allowance(this.holder, this.other)).to.eventually.equal(ethers.MaxUint256);
    });

    it('reverts when allowance is insufficient', async function () {
      await this.token.connect(this.holder).approve(this.other, shareAmount - 1n);

      await expect(this.token.connect(this.other).requestRedeem(shareAmount, this.holder, this.holder))
        .to.be.revertedWithCustomError(this.token, 'ERC20InsufficientAllowance')
        .withArgs(this.other, shareAmount - 1n, shareAmount);
    });

    it('operator bypasses allowance', async function () {
      await this.token.connect(this.holder).setOperator(this.operator, true);
      await this.token.connect(this.operator).requestRedeem(shareAmount, this.holder, this.holder);

      await expect(this.token.allowance(this.holder, this.operator)).to.eventually.equal(0n);
      await expect(this.token.pendingRedeemRequest(REQUEST_ID, this.holder)).to.eventually.equal(shareAmount);
    });
  });

  shouldSupportInterfaces(['ERC7540Operator', 'ERC7540Redeem']);
});
