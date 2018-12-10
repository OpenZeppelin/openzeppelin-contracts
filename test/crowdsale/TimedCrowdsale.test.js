const { ether } = require('../helpers/ether');
const shouldFail = require('../helpers/shouldFail');
const time = require('../helpers/time');

const { BigNumber } = require('../helpers/setup');

const TimedCrowdsaleImpl = artifacts.require('TimedCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('TimedCrowdsale', function ([_, investor, wallet, purchaser]) {
  const rate = new BigNumber(1);
  const value = ether(42);
  const tokenSupply = new BigNumber('1e22');

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await time.advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = (await time.latest()) + time.duration.weeks(1);
    this.closingTime = this.openingTime + time.duration.weeks(1);
    this.afterClosingTime = this.closingTime + time.duration.seconds(1);
    this.token = await SimpleToken.new();
  });

  it('reverts if the opening time is in the past', async function () {
    await shouldFail.reverting(TimedCrowdsaleImpl.new(
      (await time.latest()) - time.duration.days(1), this.closingTime, rate, wallet, this.token.address
    ));
  });

  it('reverts if the closing time is before the opening time', async function () {
    await shouldFail.reverting(TimedCrowdsaleImpl.new(
      this.openingTime, this.openingTime - time.duration.seconds(1), rate, wallet, this.token.address
    ));
  });

  it('reverts if the closing time equals the opening time', async function () {
    await shouldFail.reverting(TimedCrowdsaleImpl.new(
      this.openingTime, this.openingTime, rate, wallet, this.token.address
    ));
  });

  context('with crowdsale', function () {
    beforeEach(async function () {
      this.crowdsale = await TimedCrowdsaleImpl.new(
        this.openingTime, this.closingTime, rate, wallet, this.token.address
      );
      await this.token.transfer(this.crowdsale.address, tokenSupply);
    });

    it('should be ended only after end', async function () {
      (await this.crowdsale.hasClosed()).should.equal(false);
      await time.increaseTo(this.afterClosingTime);
      (await this.crowdsale.isOpen()).should.equal(false);
      (await this.crowdsale.hasClosed()).should.equal(true);
    });

    describe('accepting payments', function () {
      it('should reject payments before start', async function () {
        (await this.crowdsale.isOpen()).should.equal(false);
        await shouldFail.reverting(this.crowdsale.send(value));
        await shouldFail.reverting(this.crowdsale.buyTokens(investor, { from: purchaser, value: value }));
      });

      it('should accept payments after start', async function () {
        await time.increaseTo(this.openingTime);
        (await this.crowdsale.isOpen()).should.equal(true);
        await this.crowdsale.send(value);
        await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      });

      it('should reject payments after end', async function () {
        await time.increaseTo(this.afterClosingTime);
        await shouldFail.reverting(this.crowdsale.send(value));
        await shouldFail.reverting(this.crowdsale.buyTokens(investor, { value: value, from: purchaser }));
      });
    });
  });
});
