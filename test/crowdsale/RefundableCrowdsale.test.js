import ether from '../helpers/ether';
import { advanceBlock } from '../helpers/advanceToBlock';
import { increaseTimeTo, duration } from '../helpers/increaseTime';
import latestTime from '../helpers/latestTime';
import EVMRevert from '../helpers/EVMRevert';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
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
    this.openingTime = latestTime() + duration.weeks(1);
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

  it('should deny refunds after end if goal was reached', async function () {
    await increaseTimeTo(this.openingTime);
    await this.crowdsale.sendTransaction({ value: goal, from: investor });
    await increaseTimeTo(this.afterClosingTime);
    await this.crowdsale.claimRefund({ from: investor }).should.be.rejectedWith(EVMRevert);
  });

  it('should allow refunds after end if goal was not reached', async function () {
    await increaseTimeTo(this.openingTime);
    await this.crowdsale.sendTransaction({ value: lessThanGoal, from: investor });
    await increaseTimeTo(this.afterClosingTime);
    await this.crowdsale.finalize({ from: owner });
    const pre = web3.eth.getBalance(investor);
    await this.crowdsale.claimRefund({ from: investor, gasPrice: 0 })
      .should.be.fulfilled;
    const post = web3.eth.getBalance(investor);
    post.minus(pre).should.be.bignumber.equal(lessThanGoal);
  });

  it('should forward funds to wallet after end if goal was reached', async function () {
    await increaseTimeTo(this.openingTime);
    await this.crowdsale.sendTransaction({ value: goal, from: investor });
    await increaseTimeTo(this.afterClosingTime);
    const pre = web3.eth.getBalance(wallet);
    await this.crowdsale.finalize({ from: owner });
    const post = web3.eth.getBalance(wallet);
    post.minus(pre).should.be.bignumber.equal(goal);
  });
});
