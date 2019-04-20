const { balance, BN, constants, ether, expectEvent, shouldFail } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const AllowanceCrowdsaleImpl = artifacts.require('AllowanceCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('AllowanceCrowdsale', function ([_, investor, wallet, purchaser, tokenWallet]) {
  const rate = new BN('1');
  const value = ether('0.42');
  const expectedTokenAmount = rate.mul(value);
  const tokenAllowance = new BN('10').pow(new BN('22'));

  beforeEach(async function () {
    this.token = await SimpleToken.new({ from: tokenWallet });
    this.crowdsale = await AllowanceCrowdsaleImpl.new(rate, wallet, this.token.address, tokenWallet);
    await this.token.approve(this.crowdsale.address, tokenAllowance, { from: tokenWallet });
  });

  describe('accepting payments', function () {
    it('should have token wallet', async function () {
      (await this.crowdsale.tokenWallet()).should.be.equal(tokenWallet);
    });

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
      expectEvent.inLogs(logs, 'TokensPurchased', {
        purchaser: investor,
        beneficiary: investor,
        value: value,
        amount: expectedTokenAmount,
      });
    });

    it('should assign tokens to sender', async function () {
      await this.crowdsale.sendTransaction({ value: value, from: investor });
      (await this.token.balanceOf(investor)).should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should forward funds to wallet', async function () {
      const balanceTracker = await balance.tracker(wallet);
      await this.crowdsale.sendTransaction({ value, from: investor });
      (await balanceTracker.delta()).should.be.bignumber.equal(value);
    });
  });

  describe('check remaining allowance', function () {
    it('should report correct allowance left', async function () {
      const remainingAllowance = tokenAllowance.sub(expectedTokenAmount);
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      (await this.crowdsale.remainingTokens()).should.be.bignumber.equal(remainingAllowance);
    });

    context('when the allowance is larger than the token amount', function () {
      beforeEach(async function () {
        const amount = await this.token.balanceOf(tokenWallet);
        await this.token.approve(this.crowdsale.address, amount.addn(1), { from: tokenWallet });
      });

      it('should report the amount instead of the allowance', async function () {
        (await this.crowdsale.remainingTokens()).should.be.bignumber.equal(await this.token.balanceOf(tokenWallet));
      });
    });
  });

  describe('when token wallet is the zero address', function () {
    it('creation reverts', async function () {
      this.token = await SimpleToken.new({ from: tokenWallet });
      await shouldFail.reverting.withMessage(AllowanceCrowdsaleImpl.new(rate, wallet, this.token.address, ZERO_ADDRESS),
        'AllowanceCrowdsale: token wallet is the zero address'
      );
    });
  });
});
