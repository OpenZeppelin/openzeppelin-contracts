import ether from '../../helpers/ether';
import { advanceBlock } from '../../helpers/advanceToBlock';
import { increaseTimeTo, duration } from '../../helpers/increaseTime';
import latestTime from '../../helpers/latestTime';
import EVMRevert from '../../helpers/EVMRevert';
const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Crowdsale = artifacts.require('Crowdsale721');
const Token = artifacts.require('Mintable721Token');

const tokens = [1, 2, 3];
contract('Crowdsale', function ([_, nftOwner, investor, purchaser, crowdsaleWallet]) {
  var gas = 6721970;

  const expectedTokenAmount = tokens.length;

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    const price = ether(0.05);

    this.startTime = latestTime() + duration.days(10);
    this.afterStartTime = this.startTime + duration.seconds(1);
    this.endTime = this.startTime + duration.weeks(4) + duration.days(3);
    this.afterEndTime = this.endTime + duration.seconds(1);
    this.token = await Token.new({ from: nftOwner, gas: gas });
    this.crowdsale = await Crowdsale.new(this.startTime, this.endTime, price, crowdsaleWallet, this.token.address, { from: nftOwner, gas: gas });
    this.token.setAuthorizedMinter(this.crowdsale.address, true, { from: nftOwner });

    this.price = await this.crowdsale.startPrice();
    this.cost = this.price * tokens.length;
  });

  it('should be ended only after end', async function () {
    let ended = await this.crowdsale.hasEnded();
    ended.should.equal(false);
    await increaseTimeTo(this.afterEndTime);
    ended = await this.crowdsale.hasEnded();
    ended.should.equal(true);
  });

  describe('accepting payments', function () {
    it('should reject payments before start', async function () {
      await this.crowdsale.buyTokens(tokens, investor, { from: purchaser, value: this.cost }).should.be.rejectedWith(EVMRevert);
    });

    it('should accept payments after start', async function () {
      await increaseTimeTo(this.afterStartTime);
      await this.crowdsale.buyTokens(tokens, investor, { value: this.cost, from: purchaser }).should.be.fulfilled;
    });

    it('should reject payments after end', async function () {
      await increaseTimeTo(this.afterEndTime);
      await this.crowdsale.buyTokens(tokens, investor, { value: this.cost, from: purchaser }).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('high-level purchase', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.startTime);
    });

    it('should log purchase', async function () {
      const { logs } = await this.crowdsale.buyTokens(tokens, investor, { value: this.cost, from: investor });
      const event = logs.find(e => e.event === 'TokenPurchase');

      should.exist(event);
      event.args.purchaser.should.equal(investor);
      event.args.beneficiary.should.equal(investor);
      event.args.value.should.be.bignumber.equal(this.cost);
      event.args.tokens.should.be.bignumber.equal(tokens.length);
    });

    it('should increase totalSupply', async function () {
      await this.crowdsale.buyTokens(tokens, investor, { value: this.cost, from: investor });
      const totalSupply = await this.token.totalSupply();
      totalSupply.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should assign tokens to sender', async function () {
      await this.crowdsale.buyTokens(tokens, investor, { value: this.cost, from: investor });
      let balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should forward funds to the owner of the contract', async function () {
      const pre = web3.eth.getBalance(crowdsaleWallet);
      await this.crowdsale.buyTokens(tokens, investor, { value: this.cost, from: investor });
      const post = web3.eth.getBalance(crowdsaleWallet);
      post.minus(pre).should.be.bignumber.equal(this.cost);
    });
  });

  describe('low-level purchase', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.startTime);
    });

    it('should log purchase', async function () {
      const { logs } = await this.crowdsale.buyTokens(tokens, investor, { value: this.cost, from: purchaser });

      const event = logs.find(e => e.event === 'TokenPurchase');

      should.exist(event);
      event.args.purchaser.should.equal(purchaser);
      event.args.beneficiary.should.equal(investor);
      event.args.value.should.be.bignumber.equal(this.cost);
      event.args.tokens.should.be.bignumber.equal(tokens.length);
    });

    it('should increase totalSupply', async function () {
      await this.crowdsale.buyTokens(tokens, investor, { value: this.cost, from: purchaser });
      const totalSupply = await this.token.totalSupply();
      totalSupply.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should assign tokens to beneficiary', async function () {
      await this.crowdsale.buyTokens(tokens, investor, { value: this.cost, from: purchaser });
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should forward funds to the contract owner', async function () {
      const pre = web3.eth.getBalance(crowdsaleWallet);
      await this.crowdsale.buyTokens(tokens, investor, { value: this.cost, from: purchaser });
      const post = web3.eth.getBalance(crowdsaleWallet);
      post.minus(pre).should.be.bignumber.equal(this.cost);
    });
  });
});
