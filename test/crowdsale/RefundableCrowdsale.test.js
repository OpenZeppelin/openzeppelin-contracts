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

contract('RefundableCrowdsale', function ([_, owner, wallet, investor, purchaser]) {
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

    this.token = await SimpleToken.new();
    this.crowdsale = await RefundableCrowdsale.new(
      this.openingTime, this.closingTime, rate, wallet, this.token.address, goal, { from: owner }
    );
    await this.token.transfer(this.crowdsale.address, tokenSupply);
  });

  describe('creating a valid crowdsale', function () {
    it('should fail with zero goal', async function () {
      await expectThrow(
        RefundableCrowdsale.new(
          this.openingTime, this.closingTime, rate, wallet, this.token.address, 0, { from: owner }
        ),
        EVMRevert,
      );
    });
  });

  it('should deny refunds before end', async function () {
    await expectThrow(this.crowdsale.claimRefund({ from: investor }), EVMRevert);
    await increaseTimeTo(this.openingTime);
    await expectThrow(this.crowdsale.claimRefund({ from: investor }), EVMRevert);
  });

  it('should deny refunds after end if goal was reached', async function () {
    await increaseTimeTo(this.openingTime);
    await this.crowdsale.sendTransaction({ value: goal, from: investor });
    await increaseTimeTo(this.afterClosingTime);
    await expectThrow(this.crowdsale.claimRefund({ from: investor }), EVMRevert);
  });

  it('should allow refunds after end if goal was not reached', async function () {
    await increaseTimeTo(this.openingTime);
    await this.crowdsale.sendTransaction({ value: lessThanGoal, from: investor });
    await increaseTimeTo(this.afterClosingTime);
    await this.crowdsale.finalize({ from: owner });
    const pre = await ethGetBalance(investor);
    await this.crowdsale.claimRefund({ from: investor, gasPrice: 0 });
    const post = await ethGetBalance(investor);
    post.minus(pre).should.be.bignumber.equal(lessThanGoal);
  });

  it('should forward funds to wallet after end if goal was reached', async function () {
    await increaseTimeTo(this.openingTime);
    await this.crowdsale.sendTransaction({ value: goal, from: investor });
    await increaseTimeTo(this.afterClosingTime);
    const pre = await ethGetBalance(wallet);
    await this.crowdsale.finalize({ from: owner });
    const post = await ethGetBalance(wallet);
    post.minus(pre).should.be.bignumber.equal(goal);
  });
});
