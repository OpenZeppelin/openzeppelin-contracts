var PullPaymentMock = artifacts.require("./helpers/PullPaymentMock.sol");

contract('PullPayment', function(accounts) {

  it("can't call asyncSend externally", async function() {
    let ppc = await PullPaymentMock.new();
    assert.isUndefined(ppc.asyncSend);
  });

  it("can record an async payment correctly", async function() {
    let AMOUNT = 100;
    let ppce = await PullPaymentMock.new();
    let callSend = await ppce.callSend(accounts[0], AMOUNT);
    let paymentsToAccount0 = await ppce.payments(accounts[0]);
    let totalPayments = await ppce.totalPayments();

    assert.equal(totalPayments, AMOUNT);
    assert.equal(paymentsToAccount0, AMOUNT);
  });

  it("can add multiple balances on one account", async function() {
    let ppce = await PullPaymentMock.new();
    let call1 = await ppce.callSend(accounts[0], 200);
    let call2 = await ppce.callSend(accounts[0], 300);
    let paymentsToAccount0 = await ppce.payments(accounts[0]);
    let totalPayments = await ppce.totalPayments();

    assert.equal(totalPayments, 500);
    assert.equal(paymentsToAccount0, 500);
  });

  it("can add balances on multiple accounts", async function() {
    let ppce = await PullPaymentMock.new();
    let call1 = await ppce.callSend(accounts[0], 200);
    let call2 = await ppce.callSend(accounts[1], 300);

    let paymentsToAccount0 = await ppce.payments(accounts[0]);
    assert.equal(paymentsToAccount0, 200);

    let paymentsToAccount1 = await ppce.payments(accounts[1]);
    assert.equal(paymentsToAccount1, 300);

    let totalPayments = await ppce.totalPayments();
    assert.equal(totalPayments, 500);
  });

  it("can withdraw payment", async function() {
    let AMOUNT = 17*1e18;
    let payee = accounts[1];
    let initialBalance = web3.eth.getBalance(payee);

    let ppce = await PullPaymentMock.new({value: AMOUNT});
    let call1 = await ppce.callSend(payee, AMOUNT);

    let payment1 = await ppce.payments(payee);
    assert.equal(payment1, AMOUNT);

    let totalPayments = await ppce.totalPayments();
    assert.equal(totalPayments, AMOUNT);

    let withdraw = await ppce.withdrawPayments({from: payee});
    let payment2 = await ppce.payments(payee);
    assert.equal(payment2, 0);

    totalPayments = await ppce.totalPayments();
    assert.equal(totalPayments, 0);

    let balance = web3.eth.getBalance(payee);
    assert(Math.abs(balance-initialBalance-AMOUNT) < 1e16);
  });

});
