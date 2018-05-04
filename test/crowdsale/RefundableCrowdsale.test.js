import { advanceBlock } from '../helpers/advanceToBlock';
import { increaseTimeTo, duration } from '../helpers/increaseTime';
import latestTime from '../helpers/latestTime';
import EVMRevert from '../helpers/EVMRevert';
import ether from '../helpers/ether';
import shouldBePostDeliveryCrowdsale from './PostDeliveryCrowdsale.behavior';

const BigNumber = web3.BigNumber;
const value = ether(1);

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const RefundableCrowdsale = artifacts.require('RefundableCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('RefundableCrowdsale', function ([_, owner, wallet, investor, purchaser, otherInvestor]) {
  const rate = new BigNumber(1);
  const goal = ether(50);
  const lessThanGoal = ether(45);
  const tokenSupply = new BigNumber('1e22');

  beforeEach(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
    this.openingTime = latestTime() + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.beforeEndTime = this.closingTime - duration.hours(1);
    this.afterClosingTime = this.closingTime + duration.seconds(1);

    this.token = await SimpleToken.new();
    this.crowdsale = await RefundableCrowdsale.new(
      this.openingTime, this.closingTime, rate, wallet, this.token.address, goal, { from: owner }
    );
    await this.token.transfer(this.crowdsale.address, tokenSupply);
    this.endCrowdsale = async (goalReached = false) => {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      await this.crowdsale.buyTokens(otherInvestor, {
        value: goalReached ? goal.minus(value) : lessThanGoal,
        from: otherInvestor,
      });
      // ^ buy out the rest of the crowdsale to a random investor
      await increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.finalize({ from: owner });
    };
  });

  shouldBePostDeliveryCrowdsale(investor, purchaser, value, async function () {
    await this.endCrowdsale(true);
  });

  describe('creating a valid crowdsale', function () {
    it('should fail with zero goal', async function () {
      await RefundableCrowdsale.new(
        this.openingTime, this.closingTime, rate, wallet, this.token.address, 0, { from: owner }
      ).should.be.rejectedWith(EVMRevert);
    });
  });

  it('should deny refunds before end', async function () {
    await this.crowdsale.claimRefund({ from: investor }).should.be.rejectedWith(EVMRevert);
    await increaseTimeTo(this.openingTime);
    await this.crowdsale.claimRefund({ from: investor }).should.be.rejectedWith(EVMRevert);
  });

  context('goal not reached', function () {
    beforeEach(async function () {
      await this.endCrowdsale(false);
    });

    it('should allow refunds after end', async function () {
      const pre = web3.eth.getBalance(purchaser);
      await this.crowdsale.claimRefund({ from: purchaser, gasPrice: 0 })
        .should.be.fulfilled;
      const post = web3.eth.getBalance(purchaser);
      post.minus(pre).should.be.bignumber.equal(value);
    });
  });

  context('goal reached', function () {
    beforeEach(async function () {
      this.pre = web3.eth.getBalance(wallet);
      await this.endCrowdsale(true);
    });

    it('should deny refunds after end', async function () {
      await this.crowdsale.claimRefund({ from: purchaser })
        .should.be.rejectedWith(EVMRevert);
    });

    it('should forward funds to wallet after end', async function () {
      const post = web3.eth.getBalance(wallet);
      post.minus(this.pre).should.be.bignumber.equal(goal);
    });
  });
});
