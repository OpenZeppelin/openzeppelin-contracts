const { ethGetBalance } = require('../helpers/web3');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const PullPaymentMock = artifacts.require('PullPaymentMock');

contract('PullPayment', function ([_, payer, payee1, payee2]) {
  const amount = web3.toWei(17.0, 'ether');

  beforeEach(async function () {
    this.contract = await PullPaymentMock.new({ value: amount });
  });

  it('can record an async payment correctly', async function () {
    await this.contract.callTransfer(payee1, 100, { from: payer });
    (await this.contract.payments(payee1)).should.be.bignumber.equal(100);
  });

  it('can add multiple balances on one account', async function () {
    await this.contract.callTransfer(payee1, 200, { from: payer });
    await this.contract.callTransfer(payee1, 300, { from: payer });
    (await this.contract.payments(payee1)).should.be.bignumber.equal(500);
  });

  it('can add balances on multiple accounts', async function () {
    await this.contract.callTransfer(payee1, 200, { from: payer });
    await this.contract.callTransfer(payee2, 300, { from: payer });

    (await this.contract.payments(payee1)).should.be.bignumber.equal(200);

    (await this.contract.payments(payee2)).should.be.bignumber.equal(300);
  });

  it('can withdraw payment', async function () {
    const initialBalance = await ethGetBalance(payee1);

    await this.contract.callTransfer(payee1, amount, { from: payer });

    (await this.contract.payments(payee1)).should.be.bignumber.equal(amount);

    await this.contract.withdrawPayments(payee1);
    (await this.contract.payments(payee1)).should.be.bignumber.equal(0);

    const balance = await ethGetBalance(payee1);
    Math.abs(balance - initialBalance - amount).should.be.lt(1e16);
  });
});
