const { ether } = require('../helpers/ether');
const { advanceBlock } = require('../helpers/advanceToBlock');
const { increaseTimeTo, duration } = require('../helpers/increaseTime');
const { latestTime } = require('../helpers/latestTime');
const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');
const { ethGetBalance } = require('../helpers/web3');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const RefundableCrowdsale = artifacts.require('RefundableCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('RefundableCrowdsale', function ([_, wallet, investor, purchaser, anyone]) {
  const rate = new BigNumber(1);
  const goal = ether(50);
  const lessThanGoal = ether(45);
  const tokenSupply = new BigNumber('1e22');

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = (await latestTime()) + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.afterClosingTime = this.closingTime + duration.seconds(1);
    this.preWalletBalance = await ethGetBalance(wallet);

    this.token = await SimpleToken.new();
  });

  it('rejects a goal of zero', async function () {
    await expectThrow(
      RefundableCrowdsale.new(
        this.openingTime, this.closingTime, rate, wallet, this.token.address, 0,
      ),
      EVMRevert,
    );
  });

  context('with crowdsale', function () {
    beforeEach(async function () {
      this.crowdsale = await RefundableCrowdsale.new(
        this.openingTime, this.closingTime, rate, wallet, this.token.address, goal
      );

      await this.token.transfer(this.crowdsale.address, tokenSupply);
    });

    context('before opening time', function () {
      it('denies refunds', async function () {
        await expectThrow(this.crowdsale.claimRefund(investor), EVMRevert);
      });
    });

    context('after opening time', function () {
      beforeEach(async function () {
        await increaseTimeTo(this.openingTime);
      });

      it('denies refunds', async function () {
        await expectThrow(this.crowdsale.claimRefund(investor), EVMRevert);
      });

      context('with unreached goal', function () {
        beforeEach(async function () {
          await this.crowdsale.sendTransaction({ value: lessThanGoal, from: investor });
        });

        context('after closing time and finalization', function () {
          beforeEach(async function () {
            await increaseTimeTo(this.afterClosingTime);
            await this.crowdsale.finalize({ from: anyone });
          });

          it('refunds', async function () {
            const pre = await ethGetBalance(investor);
            await this.crowdsale.claimRefund(investor, { gasPrice: 0 });
            const post = await ethGetBalance(investor);
            post.minus(pre).should.be.bignumber.equal(lessThanGoal);
          });
        });
      });

      context('with reached goal', function () {
        beforeEach(async function () {
          await this.crowdsale.sendTransaction({ value: goal, from: investor });
        });

        context('after closing time and finalization', function () {
          beforeEach(async function () {
            await increaseTimeTo(this.afterClosingTime);
            await this.crowdsale.finalize({ from: anyone });
          });

          it('denies refunds', async function () {
            await expectThrow(this.crowdsale.claimRefund(investor), EVMRevert);
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
