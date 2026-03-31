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

  shouldSupportInterfaces(['ERC7540Operator', 'ERC7540Redeem']);
});
