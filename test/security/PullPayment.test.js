const { balance, ether } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const PullPaymentMock = artifacts.require('PullPaymentMock');

contract('PullPayment', function (accounts) {
  const [ payer, payee1, payee2 ] = accounts;

  const amount = ether('17');

  beforeEach(async function () {
    this.contract = await PullPaymentMock.new({ value: amount });
  });

  describe('payments', function () {
    it('can record an async payment correctly', async function () {
      await this.contract.callTransfer(payee1, 100, { from: payer });
      expect(await this.contract.payments(payee1)).to.be.bignumber.equal('100');
    });

    it('can add multiple balances on one account', async function () {
      await this.contract.callTransfer(payee1, 200, { from: payer });
      await this.contract.callTransfer(payee1, 300, { from: payer });
      expect(await this.contract.payments(payee1)).to.be.bignumber.equal('500');
    });

    it('can add balances on multiple accounts', async function () {
      await this.contract.callTransfer(payee1, 200, { from: payer });
      await this.contract.callTransfer(payee2, 300, { from: payer });

      expect(await this.contract.payments(payee1)).to.be.bignumber.equal('200');

      expect(await this.contract.payments(payee2)).to.be.bignumber.equal('300');
    });
  });

  describe('withdrawPayments', function () {
    it('can withdraw payment', async function () {
      const balanceTracker = await balance.tracker(payee1);

      await this.contract.callTransfer(payee1, amount, { from: payer });
      expect(await this.contract.payments(payee1)).to.be.bignumber.equal(amount);

      await this.contract.withdrawPayments(payee1);

      expect(await balanceTracker.delta()).to.be.bignumber.equal(amount);
      expect(await this.contract.payments(payee1)).to.be.bignumber.equal('0');
    });
  });
});
