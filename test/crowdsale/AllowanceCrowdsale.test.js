const { ether } = require('../helpers/ether');
const { assertRevert } = require('../helpers/assertRevert');
const { ethGetBalance } = require('../helpers/web3');

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const AllowanceCrowdsale = artifacts.require('AllowanceCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('AllowanceCrowdsale', function ([_, investor, wallet, purchaser, tokenWallet]) {
  const rate = new BigNumber(1);
  const value = ether(0.42);
  const expectedTokenAmount = rate.mul(value);
  const tokenAllowance = new BigNumber('1e22');
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  beforeEach(async function () {
    this.token = await SimpleToken.new({ from: tokenWallet });
    this.crowdsale = await AllowanceCrowdsale.new(rate, wallet, this.token.address, tokenWallet);
    await this.token.approve(this.crowdsale.address, tokenAllowance, { from: tokenWallet });
  });

  describe('accepting payments', function () {
    it('should accept sends', async function () {
      await this.crowdsale.send(value);
    });

    it('should accept payments', async function () {
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

  describe('check remaining allowance', function () {
    it('should report correct allowace left', async function () {
      const remainingAllowance = tokenAllowance - expectedTokenAmount;
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      const tokensRemaining = await this.crowdsale.remainingTokens();
      tokensRemaining.should.be.bignumber.equal(remainingAllowance);
    });
  });

  describe('when token wallet is different from token address', function () {
    it('creation reverts', async function () {
      this.token = await SimpleToken.new({ from: tokenWallet });
      await assertRevert(AllowanceCrowdsale.new(rate, wallet, this.token.address, ZERO_ADDRESS));
    });
  });
});
