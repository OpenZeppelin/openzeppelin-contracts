const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeERC7540Deposit } = require('./ERC7540.behavior');
const { shouldSupportInterfaces } = require('../../../utils/introspection/SupportsInterface.behavior');

const REQUEST_ID = 0n;
const depositAmount = 1000n;

async function fixture() {
  const [holder, operator, recipient, other] = await ethers.getSigners();
  const asset = await ethers.deployContract('$ERC20Mock');
  const token = await ethers.deployContract('$ERC7540Deposit', ['', '', asset]);
  return { token, asset, holder, operator, recipient, other };
}

describe('ERC7540Deposit', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeERC7540Deposit();

  describe('internal functions', function () {
    describe('_setPendingDeposit', function () {
      it('sets the pending deposit for a controller', async function () {
        await this.token.$_setPendingDeposit(this.holder, depositAmount);
        await expect(this.token.pendingDepositRequest(REQUEST_ID, this.holder)).to.eventually.equal(depositAmount);
      });
    });

    describe('_setClaimableDeposit', function () {
      it('sets the claimable deposit for a controller', async function () {
        await this.token.$_setClaimableDeposit(this.holder, depositAmount, depositAmount);
        await expect(this.token.claimableDepositRequest(REQUEST_ID, this.holder)).to.eventually.equal(depositAmount);
        await expect(this.token.claimableDepositRequestShares(REQUEST_ID, this.holder)).to.eventually.equal(
          depositAmount,
        );
      });
    });
  });

  shouldSupportInterfaces(['ERC7540Operator', 'ERC7540Deposit']);
});
