const { ether } = require('../helpers/ether');
const { advanceBlock } = require('../helpers/advanceToBlock');
const { increaseTimeTo, duration } = require('../helpers/increaseTime');
const { latestTime } = require('../helpers/latestTime');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const IncreasingPriceCrowdsale = artifacts.require('IncreasingPriceCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('IncreasingPriceCrowdsale', function ([_, investor, wallet, purchaser]) {
  const value = ether(1);
  const tokenSupply = new BigNumber('1e22');

  describe('rate during crowdsale should change at a fixed step every block', async function () {
    let balance;
    const initialRate = new BigNumber(9166);
    const finalRate = new BigNumber(5500);
    const rateAtTime150 = new BigNumber(9166);
    const rateAtTime300 = new BigNumber(9165);
    const rateAtTime1500 = new BigNumber(9157);
    const rateAtTime30 = new BigNumber(9166);
    const rateAtTime150000 = new BigNumber(8257);
    const rateAtTime450000 = new BigNumber(6439);

    beforeEach(async function () {
      await advanceBlock();
      this.startTime = (await latestTime()) + duration.weeks(1);
      this.closingTime = this.startTime + duration.weeks(1);
      this.afterClosingTime = this.closingTime + duration.seconds(1);
      this.token = await SimpleToken.new();
      this.crowdsale = await IncreasingPriceCrowdsale.new(
        this.startTime, this.closingTime, wallet, this.token.address, initialRate, finalRate
      );
      await this.token.transfer(this.crowdsale.address, tokenSupply);
    });

    it('at start', async function () {
      await increaseTimeTo(this.startTime);
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(value.mul(initialRate));
    });

    it('at time 150', async function () {
      await increaseTimeTo(this.startTime + 150);
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(value.mul(rateAtTime150));
    });

    it('at time 300', async function () {
      await increaseTimeTo(this.startTime + 300);
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(value.mul(rateAtTime300));
    });

    it('at time 1500', async function () {
      await increaseTimeTo(this.startTime + 1500);
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(value.mul(rateAtTime1500));
    });

    it('at time 30', async function () {
      await increaseTimeTo(this.startTime + 30);
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(value.mul(rateAtTime30));
    });

    it('at time 150000', async function () {
      await increaseTimeTo(this.startTime + 150000);
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(value.mul(rateAtTime150000));
    });

    it('at time 450000', async function () {
      await increaseTimeTo(this.startTime + 450000);
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(value.mul(rateAtTime450000));
    });
  });
});
