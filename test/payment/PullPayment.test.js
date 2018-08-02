const { ethGetBalance } = require('../helpers/web3');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const PullPaymentMock = artifacts.require('PullPaymentMock');

contract('PullPayment', function (accounts) {
  const amount = web3.toWei(17.0, 'ether');

  beforeEach(async function () {
    this.contract = await PullPaymentMock.new({ value: amount });
  });

  it('can\'t call asyncSend externally', async function () {
    assert.isUndefined(this.contract.asyncSend);
  });

  it('can record an async payment correctly', async function () {
    const AMOUNT = 100;
    await this.contract.callTransfer(accounts[0], AMOUNT);

    const paymentsToAccount0 = await this.contract.payments(accounts[0]);
    paymentsToAccount0.should.be.bignumber.equal(AMOUNT);
  });

  it('can add multiple balances on one account', async function () {
    await this.contract.callTransfer(accounts[0], 200);
    await this.contract.callTransfer(accounts[0], 300);
    const paymentsToAccount0 = await this.contract.payments(accounts[0]);
    paymentsToAccount0.should.be.bignumber.equal(500);
  });

  it('can add balances on multiple accounts', async function () {
    await this.contract.callTransfer(accounts[0], 200);
    await this.contract.callTransfer(accounts[1], 300);

    const paymentsToAccount0 = await this.contract.payments(accounts[0]);
    paymentsToAccount0.should.be.bignumber.equal(200);

    const paymentsToAccount1 = await this.contract.payments(accounts[1]);
    paymentsToAccount1.should.be.bignumber.equal(300);
  });

  it('can withdraw payment', async function () {
    const payee = accounts[1];
    const initialBalance = await ethGetBalance(payee);

    await this.contract.callTransfer(payee, amount);

    const payment1 = await this.contract.payments(payee);
    payment1.should.be.bignumber.equal(amount);

    await this.contract.withdrawPayments({ from: payee });
    const payment2 = await this.contract.payments(payee);
    payment2.should.be.bignumber.equal(0);

    const balance = await ethGetBalance(payee);
    Math.abs(balance - initialBalance - amount).should.be.lt(1e16);
  });
});
