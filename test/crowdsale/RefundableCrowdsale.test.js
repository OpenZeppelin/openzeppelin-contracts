const { ether } = require('../helpers/ether');
const { balanceDifference } = require('../helpers/balanceDifference');
const shouldFail = require('../helpers/shouldFail');
const time = require('../helpers/time');
const { ethGetBalance } = require('../helpers/web3');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const RefundableCrowdsaleImpl = artifacts.require('RefundableCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('RefundableCrowdsale', function ([_, wallet, investor, purchaser, anyone]) {
  const rate = new BigNumber(1);
  const goal = ether(50);
  const lessThanGoal = ether(45);
  const tokenSupply = new BigNumber('1e22');

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await time.advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = (await time.latest()) + time.duration.weeks(1);
    this.closingTime = this.openingTime + time.duration.weeks(1);
    this.afterClosingTime = this.closingTime + time.duration.seconds(1);
    this.preWalletBalance = await ethGetBalance(wallet);

    this.token = await SimpleToken.new();
  });

  it('rejects a goal of zero', async function () {
    await shouldFail.reverting(
      RefundableCrowdsaleImpl.new(this.openingTime, this.closingTime, rate, wallet, this.token.address, 0)
    );
  });

  context('with crowdsale', function () {
    beforeEach(async function () {
      this.crowdsale = await RefundableCrowdsaleImpl.new(
        this.openingTime, this.closingTime, rate, wallet, this.token.address, goal
      );

      await this.token.transfer(this.crowdsale.address, tokenSupply);
    });

    context('before opening time', function () {
      it('denies refunds', async function () {
        await shouldFail.reverting(this.crowdsale.claimRefund(investor));
      });
    });

    context('after opening time', function () {
      beforeEach(async function () {
        await time.increaseTo(this.openingTime);
      });

      it('denies refunds', async function () {
        await shouldFail.reverting(this.crowdsale.claimRefund(investor));
      });

      context('with unreached goal', function () {
        beforeEach(async function () {
          await this.crowdsale.sendTransaction({ value: lessThanGoal, from: investor });
        });

        context('after closing time and finalization', function () {
          beforeEach(async function () {
            await time.increaseTo(this.afterClosingTime);
            await this.crowdsale.finalize({ from: anyone });
          });

          it('refunds', async function () {
            (await balanceDifference(investor, () =>
              this.crowdsale.claimRefund(investor, { gasPrice: 0 }))
            ).should.be.bignumber.equal(lessThanGoal);
          });
        });
      });

      context('with reached goal', function () {
        beforeEach(async function () {
          await this.crowdsale.sendTransaction({ value: goal, from: investor });
        });

        context('after closing time and finalization', function () {
          beforeEach(async function () {
            await time.increaseTo(this.afterClosingTime);
            await this.crowdsale.finalize({ from: anyone });
          });

          it('denies refunds', async function () {
            await shouldFail.reverting(this.crowdsale.claimRefund(investor));
          });

          it('forwards funds to wallet', async function () {
            const postWalletBalance = await ethGetBalance(wallet);
            postWalletBalance.minus(this.preWalletBalance).should.be.bignumber.equal(goal);
          });
        });
      });
    });
  });
});
