const { balance, constants, ether, expectEvent, send, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const MultiPaymentSplitter = artifacts.require('MultiPaymentSplitter');
const Token = artifacts.require('ERC20Mock');

contract('MultiPaymentSplitter', function (accounts) {
  const [ owner, payee1, payee2, payee3, nonpayee1 ] = accounts;

  const amount = ether('1');

  it('rejects an empty set of payees', async function () {
    await expectRevert(MultiPaymentSplitter.new([], []), 'PaymentSplitter: no payees');
  });

  it('rejects more payees than shares', async function () {
    await expectRevert(MultiPaymentSplitter.new([payee1, payee2, payee3], [20, 30]),
      'PaymentSplitter: payees and shares length mismatch',
    );
  });

  it('rejects more shares than payees', async function () {
    await expectRevert(MultiPaymentSplitter.new([payee1, payee2], [20, 30, 40]),
      'PaymentSplitter: payees and shares length mismatch',
    );
  });

  it('rejects null payees', async function () {
    await expectRevert(MultiPaymentSplitter.new([payee1, ZERO_ADDRESS], [20, 30]),
      'PaymentSplitter: account is the zero address',
    );
  });

  it('rejects zero-valued shares', async function () {
    await expectRevert(MultiPaymentSplitter.new([payee1, payee2], [20, 0]),
      'PaymentSplitter: shares are 0',
    );
  });

  it('rejects repeated payees', async function () {
    await expectRevert(MultiPaymentSplitter.new([payee1, payee1], [20, 30]),
      'PaymentSplitter: account already has shares',
    );
  });

  context('once deployed', function () {
    beforeEach(async function () {
      this.payees = [payee1, payee2];
      this.shares = [40, 60];

      this.contract = await MultiPaymentSplitter.new(this.payees, this.shares);
      this.tokens   = [
        await Token.new('Token #0', 'T0', owner, ether('1000')),
        await Token.new('Token #1', 'T1', owner, ether('1000')),
      ];
    });

    it('accepts payments', async function () {
      await this.tokens[0].transfer(this.contract.address, amount, { from: owner });

      expect(await this.tokens[0].balanceOf(this.contract.address)).to.be.bignumber.equal(amount);
    });

    describe('release', async function () {
      it('reverts if no funds to claim', async function () {
        await expectRevert(this.contract.release(this.tokens[0].address, payee1),
          'MultiPaymentSplitter: account is not due payment',
        );
      });

      it('reverts if non-payee want to claim', async function () {
        await this.tokens[0].transfer(this.contract.address, amount, { from: owner });
        await expectRevert(this.contract.release(this.tokens[0].address, nonpayee1),
          'MultiPaymentSplitter: account has no shares',
        );
      });
    });

    it('distributes funds to payees', async function () {
      expect(await this.tokens[0].balanceOf(payee1)).to.be.bignumber.equal('0');
      expect(await this.tokens[0].balanceOf(payee2)).to.be.bignumber.equal('0');
      expect(await this.tokens[1].balanceOf(payee1)).to.be.bignumber.equal('0');
      expect(await this.tokens[1].balanceOf(payee2)).to.be.bignumber.equal('0');

      await this.tokens[0].transfer(this.contract.address, amount, { from: owner });

      expectEvent(
        await this.contract.release(this.tokens[0].address, payee1),
        'PaymentReleased',
        { asset: this.tokens[0].address, to: payee1, amount: ether('0.40') },
      );

      await this.tokens[1].transfer(this.contract.address, amount, { from: owner });

      expectEvent(
        await this.contract.release(this.tokens[1].address, payee1),
        'PaymentReleased',
        { asset: this.tokens[1].address, to: payee1, amount: ether('0.40') },
      );

      await this.tokens[0].transfer(this.contract.address, amount, { from: owner });

      expectEvent(
        await this.contract.release(this.tokens[0].address, payee1),
        'PaymentReleased',
        { asset: this.tokens[0].address, to: payee1, amount: ether('0.40') },
      );

      expectEvent(
        await this.contract.release(this.tokens[0].address, payee2),
        'PaymentReleased',
        { asset: this.tokens[0].address, to: payee2, amount: ether('1.20') },
      );

      expectEvent(
        await this.contract.release(this.tokens[1].address, payee2),
        'PaymentReleased',
        { asset: this.tokens[1].address, to: payee2, amount: ether('0.60') },
      );

      expect(await this.tokens[0].balanceOf(payee1)).to.be.bignumber.equal(ether('0.80'));
      expect(await this.tokens[0].balanceOf(payee2)).to.be.bignumber.equal(ether('1.20'));
      expect(await this.tokens[1].balanceOf(payee1)).to.be.bignumber.equal(ether('0.40'));
      expect(await this.tokens[1].balanceOf(payee2)).to.be.bignumber.equal(ether('0.60'));
    });
  });
});
