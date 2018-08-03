const { ether } = require('../helpers/ether');
const { ethGetBalance } = require('../helpers/web3');

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Crowdsale = artifacts.require('Crowdsale');
const SimpleToken = artifacts.require('SimpleToken');

contract('Crowdsale', function ([_, investor, wallet, purchaser]) {
  const rate = new BigNumber(1);
  const value = ether(42);
  const tokenSupply = new BigNumber('1e22');
  const expectedTokenAmount = rate.mul(value);

  beforeEach(async function () {
    this.token = await SimpleToken.new();
    this.crowdsale = await Crowdsale.new(rate, wallet, this.token.address);
    await this.token.transfer(this.crowdsale.address, tokenSupply);
  });

  describe('accepting payments', function () {
    it('should accept payments', async function () {
      await this.crowdsale.send(value);
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
    });
  });

  describe('high-level purchase', function () {
    it('should log purchase', async function () {
      const { logs } = await this.crowdsale.sendTransaction({ value: value, from: investor });
      const event = logs.find(e => e.event === 'TokenPurchase');
      should.exist(event);
      event.args.purchaser.should.equal(investor);
      event.args.beneficiary.should.equal(investor);
      event.args.value.should.be.bignumber.equal(value);
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should assign tokens to sender', async function () {
      await this.crowdsale.sendTransaction({ value: value, from: investor });
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should forward funds to wallet', async function () {
      const pre = await ethGetBalance(wallet);
      await this.crowdsale.sendTransaction({ value, from: investor });
      const post = await ethGetBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(value);
    });
  });

  describe('low-level purchase', function () {
    it('should log purchase', async function () {
      const { logs } = await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      const event = logs.find(e => e.event === 'TokenPurchase');
      should.exist(event);
      event.args.purchaser.should.equal(purchaser);
      event.args.beneficiary.should.equal(investor);
      event.args.value.should.be.bignumber.equal(value);
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should assign tokens to beneficiary', async function () {
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should forward funds to wallet', async function () {
      const pre = await ethGetBalance(wallet);
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      const post = await ethGetBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(value);
    });
  });
});
