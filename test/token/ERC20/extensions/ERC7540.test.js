const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeERC7540Deposit, shouldBehaveLikeERC7540Redeem } = require('./ERC7540.behavior');
const { shouldSupportInterfaces } = require('../../../utils/introspection/SupportsInterface.behavior');

const REQUEST_ID = 0n;
const amount = 1000n;

async function fixture() {
  const [holder, operator, recipient, other] = await ethers.getSigners();
  const asset = await ethers.deployContract('$ERC20Mock');
  const token = await ethers.deployContract('$ERC7540', ['', '', asset]);
  return { token, asset, holder, operator, recipient, other };
}

describe('ERC7540', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeERC7540Deposit();
  shouldBehaveLikeERC7540Redeem();

  describe('internal functions', function () {
    describe('_setPendingDeposit', function () {
      it('sets the pending deposit for a controller', async function () {
        await this.token.$_setPendingDeposit(this.holder, amount);
        await expect(this.token.pendingDepositRequest(REQUEST_ID, this.holder)).to.eventually.equal(amount);
      });
    });

    describe('_setClaimableDeposit', function () {
      it('sets the claimable deposit for a controller', async function () {
        await this.token.$_setClaimableDeposit(this.holder, amount, amount);
        await expect(this.token.claimableDepositRequest(REQUEST_ID, this.holder)).to.eventually.equal(amount);
        await expect(this.token.claimableDepositRequestShares(REQUEST_ID, this.holder)).to.eventually.equal(amount);
      });
    });

    describe('_setPendingRedeem', function () {
      it('sets the pending redeem for a controller', async function () {
        await this.token.$_setPendingRedeem(this.holder, amount);
        await expect(this.token.pendingRedeemRequest(REQUEST_ID, this.holder)).to.eventually.equal(amount);
      });
    });

    describe('_setClaimableRedeem', function () {
      it('sets the claimable redeem for a controller', async function () {
        await this.token.$_setClaimableRedeem(this.holder, amount, amount);
        await expect(this.token.claimableRedeemRequestAssets(REQUEST_ID, this.holder)).to.eventually.equal(amount);
        await expect(this.token.claimableRedeemRequest(REQUEST_ID, this.holder)).to.eventually.equal(amount);
      });
    });
  });

  shouldSupportInterfaces(['ERC7540Operator', 'ERC7540Deposit', 'ERC7540Redeem']);
});
