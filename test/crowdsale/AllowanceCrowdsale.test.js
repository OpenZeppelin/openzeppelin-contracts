const { accounts, contract } = require('@openzeppelin/test-environment');

const { balance, BN, constants, ether, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const AllowanceCrowdsaleImpl = contract.fromArtifact('AllowanceCrowdsaleImpl');
const SimpleToken = contract.fromArtifact('SimpleToken');

describe('AllowanceCrowdsale', function () {
  const [ investor, wallet, purchaser, tokenWallet ] = accounts;

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
      expect(await this.crowdsale.tokenWallet()).to.equal(tokenWallet);
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
      expect(await this.token.balanceOf(investor)).to.be.bignumber.equal(expectedTokenAmount);
    });

    it('should forward funds to wallet', async function () {
      const balanceTracker = await balance.tracker(wallet);
      await this.crowdsale.sendTransaction({ value, from: investor });
      expect(await balanceTracker.delta()).to.be.bignumber.equal(value);
    });
  });

  describe('check remaining allowance', function () {
    it('should report correct allowance left', async function () {
      const remainingAllowance = tokenAllowance.sub(expectedTokenAmount);
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      expect(await this.crowdsale.remainingTokens()).to.be.bignumber.equal(remainingAllowance);
    });

    context('when the allowance is larger than the token amount', function () {
      beforeEach(async function () {
        const amount = await this.token.balanceOf(tokenWallet);
        await this.token.approve(this.crowdsale.address, amount.addn(1), { from: tokenWallet });
      });

      it('should report the amount instead of the allowance', async function () {
        expect(await this.crowdsale.remainingTokens()).to.be.bignumber.equal(await this.token.balanceOf(tokenWallet));
      });
    });
  });

  describe('when token wallet is the zero address', function () {
    it('creation reverts', async function () {
      this.token = await SimpleToken.new({ from: tokenWallet });
      await expectRevert(AllowanceCrowdsaleImpl.new(rate, wallet, this.token.address, ZERO_ADDRESS),
        'AllowanceCrowdsale: token wallet is the zero address'
      );
    });
  });
});
