const { BN, ether, shouldFail, time } = require('openzeppelin-test-helpers');

const IncreasingPriceCrowdsaleImpl = artifacts.require('IncreasingPriceCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('IncreasingPriceCrowdsale', function ([_, investor, wallet, purchaser]) {
  const value = ether('1');
  const tokenSupply = new BN('10').pow(new BN('22'));

  describe('rate during crowdsale should change at a fixed step every block', async function () {
    const initialRate = new BN('9166');
    const finalRate = new BN('5500');
    const rateAtTime150 = new BN('9166');
    const rateAtTime300 = new BN('9165');
    const rateAtTime1500 = new BN('9157');
    const rateAtTime30 = new BN('9166');
    const rateAtTime150000 = new BN('8257');
    const rateAtTime450000 = new BN('6439');

    beforeEach(async function () {
      await time.advanceBlock();
      this.startTime = (await time.latest()).add(time.duration.weeks(1));
      this.closingTime = this.startTime.add(time.duration.weeks(1));
      this.afterClosingTime = this.closingTime.add(time.duration.seconds(1));
      this.token = await SimpleToken.new();
    });

    it('reverts with a final rate larger than the initial rate', async function () {
      await shouldFail.reverting.withMessage(IncreasingPriceCrowdsaleImpl.new(
        this.startTime, this.closingTime, wallet, this.token.address, initialRate, initialRate.addn(1)
      ), 'IncreasingPriceCrowdsale: initial rate is not greater than final rate');
    });

    it('reverts with a final rate equal to the initial rate', async function () {
      await shouldFail.reverting.withMessage(IncreasingPriceCrowdsaleImpl.new(
        this.startTime, this.closingTime, wallet, this.token.address, initialRate, initialRate
      ), 'IncreasingPriceCrowdsale: initial rate is not greater than final rate');
    });

    it('reverts with a final rate of zero', async function () {
      await shouldFail.reverting.withMessage(IncreasingPriceCrowdsaleImpl.new(
        this.startTime, this.closingTime, wallet, this.token.address, initialRate, 0
      ), 'IncreasingPriceCrowdsale: final rate is 0');
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
        await shouldFail.reverting.withMessage(this.crowdsale.rate(),
          'IncreasingPriceCrowdsale: rate() called'
        );
      });

      it('returns a rate of 0 before the crowdsale starts', async function () {
        (await this.crowdsale.getCurrentRate()).should.be.bignumber.equal('0');
      });

      it('returns a rate of 0 after the crowdsale ends', async function () {
        await time.increaseTo(this.afterClosingTime);
        (await this.crowdsale.getCurrentRate()).should.be.bignumber.equal('0');
      });

      it('at start', async function () {
        await time.increaseTo(this.startTime);
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        (await this.token.balanceOf(investor)).should.be.bignumber.equal(value.mul(initialRate));
      });

      it('at time 150', async function () {
        await time.increaseTo(this.startTime.addn(150));
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        (await this.token.balanceOf(investor)).should.be.bignumber.equal(value.mul(rateAtTime150));
      });

      it('at time 300', async function () {
        await time.increaseTo(this.startTime.addn(300));
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        (await this.token.balanceOf(investor)).should.be.bignumber.equal(value.mul(rateAtTime300));
      });

      it('at time 1500', async function () {
        await time.increaseTo(this.startTime.addn(1500));
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        (await this.token.balanceOf(investor)).should.be.bignumber.equal(value.mul(rateAtTime1500));
      });

      it('at time 30', async function () {
        await time.increaseTo(this.startTime.addn(30));
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        (await this.token.balanceOf(investor)).should.be.bignumber.equal(value.mul(rateAtTime30));
      });

      it('at time 150000', async function () {
        await time.increaseTo(this.startTime.addn(150000));
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        (await this.token.balanceOf(investor)).should.be.bignumber.equal(value.mul(rateAtTime150000));
      });

      it('at time 450000', async function () {
        await time.increaseTo(this.startTime.addn(450000));
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        (await this.token.balanceOf(investor)).should.be.bignumber.equal(value.mul(rateAtTime450000));
      });
    });
  });
});
