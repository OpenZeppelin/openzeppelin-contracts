import ether from '../helpers/ether';

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const AllowanceCrowdsale = artifacts.require('AllowanceCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('AllowanceCrowdsale', function ([_, investor, wallet, purchaser, tokenWallet]) {
  const rate = new BigNumber(1);
  const value = ether(0.42);
  const expectedTokenAmount = rate.mul(value);
  const tokenAllowance = new BigNumber('1e22');

  beforeEach(async function () {
    this.token = await SimpleToken.new({ from: tokenWallet });
    this.crowdsale = await AllowanceCrowdsale.new(rate, wallet, this.token.address, tokenWallet);
    await this.token.approve(this.crowdsale.address, tokenAllowance, { from: tokenWallet });
  });

  describe('accepting payments', function () {
    it('should accept sends', async function () {
      await this.crowdsale.send(value).should.be.fulfilled;
    });
    
    it('should accept payments', async function () {
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.fulfilled;
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
      let balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet);
      await this.crowdsale.sendTransaction({ value, from: investor });
      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(value);
    });
  });

  describe('check remaining allowance', function () {
    it('should report correct allowace left', async function () {
      let remainingAllowance = tokenAllowance - expectedTokenAmount;
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      let tokensRemaining = await this.crowdsale.remainingTokens();
      tokensRemaining.should.be.bignumber.equal(remainingAllowance);
    });
  });
});
