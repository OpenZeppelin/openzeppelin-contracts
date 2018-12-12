const { ether } = require('../helpers/ether');
const time = require('../helpers/time');
const shouldFail = require('../helpers/shouldFail');

const { BigNumber } = require('../helpers/setup');

const IncreasingPriceCrowdsaleImpl = artifacts.require('IncreasingPriceCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('IncreasingPriceCrowdsale', function ([_, investor, wallet, purchaser]) {
  const value = ether(1);
  const tokenSupply = new BigNumber('1e22');

  describe('rate during crowdsale should change at a fixed step every block', async function () {
    const initialRate = new BigNumber(9166);
    const finalRate = new BigNumber(5500);
    const rateAtTime150 = new BigNumber(9166);
    const rateAtTime300 = new BigNumber(9165);
    const rateAtTime1500 = new BigNumber(9157);
    const rateAtTime30 = new BigNumber(9166);
    const rateAtTime150000 = new BigNumber(8257);
    const rateAtTime450000 = new BigNumber(6439);

    beforeEach(async function () {
      await time.advanceBlock();
      this.startTime = (await time.latest()) + time.duration.weeks(1);
      this.closingTime = this.startTime + time.duration.weeks(1);
      this.afterClosingTime = this.closingTime + time.duration.seconds(1);
      this.token = await SimpleToken.new();
    });

    it('reverts with a final rate larger than the initial rate', async function () {
      await shouldFail.reverting(IncreasingPriceCrowdsaleImpl.new(
        this.startTime, this.closingTime, wallet, this.token.address, initialRate, initialRate.plus(1)
      ));
    });

    it('reverts with a final equal to the initial rate', async function () {
      await shouldFail.reverting(IncreasingPriceCrowdsaleImpl.new(
        this.startTime, this.closingTime, wallet, this.token.address, initialRate, initialRate
      ));
    });

    it('reverts with a final rate of zero', async function () {
      await shouldFail.reverting(IncreasingPriceCrowdsaleImpl.new(
        this.startTime, this.closingTime, wallet, this.token.address, initialRate, 0
      ));
    });

    context('with crowdsale', function () {
      beforeEach(async function () {
        this.crowdsale = await IncreasingPriceCrowdsaleImpl.new(
          this.startTime, this.closingTime, wallet, this.token.address, initialRate, finalRate
        );
        await this.token.transfer(this.crowdsale.address, tokenSupply);
      });

      it('should have initial and final rate', async function () {
        (await this.crowdsale.initialRate()).should.be.bignumber.equal(initialRate);
        (await this.crowdsale.finalRate()).should.be.bignumber.equal(finalRate);
      });

      it('reverts when the base Crowdsale\'s rate function is called', async function () {
        await shouldFail.reverting(this.crowdsale.rate());
      });

      it('returns a rate of 0 before the crowdsale starts', async function () {
        (await this.crowdsale.getCurrentRate()).should.be.bignumber.equal(0);
      });

      it('returns a rate of 0 after the crowdsale ends', async function () {
        await time.increaseTo(this.afterClosingTime);
        (await this.crowdsale.getCurrentRate()).should.be.bignumber.equal(0);
      });

      it('at start', async function () {
        await time.increaseTo(this.startTime);
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        (await this.token.balanceOf(investor)).should.be.bignumber.equal(value.mul(initialRate));
      });

      it('at time 150', async function () {
        await time.increaseTo(this.startTime + 150);
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        (await this.token.balanceOf(investor)).should.be.bignumber.equal(value.mul(rateAtTime150));
      });

      it('at time 300', async function () {
        await time.increaseTo(this.startTime + 300);
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        (await this.token.balanceOf(investor)).should.be.bignumber.equal(value.mul(rateAtTime300));
      });

      it('at time 1500', async function () {
        await time.increaseTo(this.startTime + 1500);
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        (await this.token.balanceOf(investor)).should.be.bignumber.equal(value.mul(rateAtTime1500));
      });

      it('at time 30', async function () {
        await time.increaseTo(this.startTime + 30);
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        (await this.token.balanceOf(investor)).should.be.bignumber.equal(value.mul(rateAtTime30));
      });

      it('at time 150000', async function () {
        await time.increaseTo(this.startTime + 150000);
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        (await this.token.balanceOf(investor)).should.be.bignumber.equal(value.mul(rateAtTime150000));
      });

      it('at time 450000', async function () {
        await time.increaseTo(this.startTime + 450000);
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        (await this.token.balanceOf(investor)).should.be.bignumber.equal(value.mul(rateAtTime450000));
      });
    });
  });
});
