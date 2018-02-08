var PullPaymentMock = artifacts.require('PullPaymentMock');

contract('PullPayment', function (accounts) {
  let ppce;
  let amount = 17 * 1e18;

  beforeEach(async function () {
    ppce = await PullPaymentMock.new({ value: amount });
  });

  it('can\'t call asyncSend externally', async function () {
    assert.isUndefined(ppce.asyncSend);
  });

  it('can record an async payment correctly', async function () {
    let AMOUNT = 100;
    await ppce.callSend(accounts[0], AMOUNT);
    let paymentsToAccount0 = await ppce.payments(accounts[0]);
    let totalPayments = await ppce.totalPayments();

    assert.equal(totalPayments, AMOUNT);
    assert.equal(paymentsToAccount0, AMOUNT);
  });

  it('can add multiple balances on one account', async function () {
    await ppce.callSend(accounts[0], 200);
    await ppce.callSend(accounts[0], 300);
    let paymentsToAccount0 = await ppce.payments(accounts[0]);
    let totalPayments = await ppce.totalPayments();

    assert.equal(totalPayments, 500);
    assert.equal(paymentsToAccount0, 500);
  });

  it('can add balances on multiple accounts', async function () {
    await ppce.callSend(accounts[0], 200);
    await ppce.callSend(accounts[1], 300);

    let paymentsToAccount0 = await ppce.payments(accounts[0]);
    assert.equal(paymentsToAccount0, 200);

    let paymentsToAccount1 = await ppce.payments(accounts[1]);
    assert.equal(paymentsToAccount1, 300);

    let totalPayments = await ppce.totalPayments();
    assert.equal(totalPayments, 500);
  });

  it('can withdraw payment', async function () {
    let payee = accounts[1];
    let initialBalance = web3.eth.getBalance(payee);

    await ppce.callSend(payee, amount);

    let payment1 = await ppce.payments(payee);
    assert.equal(payment1, amount);

    let totalPayments = await ppce.totalPayments();
    assert.equal(totalPayments, amount);

    await ppce.withdrawPayments({ from: payee });
    let payment2 = await ppce.payments(payee);
    assert.equal(payment2, 0);

    totalPayments = await ppce.totalPayments();
    assert.equal(totalPayments, 0);

    let balance = web3.eth.getBalance(payee);
    assert(Math.abs(balance - initialBalance - amount) < 1e16);
  });
});
