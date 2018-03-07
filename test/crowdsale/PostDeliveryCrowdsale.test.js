import { advanceBlock } from '../helpers/advanceToBlock';
import { increaseTimeTo, duration } from '../helpers/increaseTime';
import latestTime from '../helpers/latestTime';
import EVMRevert from '../helpers/EVMRevert';
import ether from '../helpers/ether';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const PostDeliveryCrowdsale = artifacts.require('PostDeliveryCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('PostDeliveryCrowdsale', function ([_, investor, wallet, purchaser]) {
  const rate = new BigNumber(1);
  const value = ether(42);
  const tokenSupply = new BigNumber('1e22');

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = latestTime() + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.beforeEndTime = this.closingTime - duration.hours(1);
    this.afterClosingTime = this.closingTime + duration.seconds(1);
    this.token = await SimpleToken.new();
    this.crowdsale = await PostDeliveryCrowdsale.new(
      this.openingTime, this.closingTime, rate, wallet, this.token.address
    );
    await this.token.transfer(this.crowdsale.address, tokenSupply);
  });

  it('should not immediately assign tokens to beneficiary', async function () {
    await increaseTimeTo(this.openingTime);
    await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
    const balance = await this.token.balanceOf(investor);
    balance.should.be.bignumber.equal(0);
  });

  it('should not allow beneficiaries to withdraw tokens before crowdsale ends', async function () {
    await increaseTimeTo(this.beforeEndTime);
    await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
    await this.crowdsale.withdrawTokens({ from: investor }).should.be.rejectedWith(EVMRevert);
  });

  it('should allow beneficiaries to withdraw tokens after crowdsale ends', async function () {
    await increaseTimeTo(this.openingTime);
    await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
    await increaseTimeTo(this.afterClosingTime);
    await this.crowdsale.withdrawTokens({ from: investor }).should.be.fulfilled;
  });

  it('should return the amount of tokens bought', async function () {
    await increaseTimeTo(this.openingTime);
    await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
    await increaseTimeTo(this.afterClosingTime);
    await this.crowdsale.withdrawTokens({ from: investor });
    const balance = await this.token.balanceOf(investor);
    balance.should.be.bignumber.equal(value);
  });
});
