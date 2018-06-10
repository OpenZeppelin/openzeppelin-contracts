var CancellablePullPaymentMock = artifacts.require("./helpers/CancellablePullPaymentMock.sol");

contract('CancellablePullPayment', function(accounts) {

  it("can cancel a payment before the payee has withdrawn it", async function() {
    let AMOUNT = 17*1e18;
    let payee = accounts[1];

    let cancellablePullPayment = await CancellablePullPaymentMock.new({value: AMOUNT});
    let call1 = await cancellablePullPayment.callSend(payee, AMOUNT);

    let payment1 = await cancellablePullPayment.payments(payee);
    assert.equal(payment1, AMOUNT);

    let totalPayments = await cancellablePullPayment.totalPayments();
    assert.equal(totalPayments, AMOUNT);

    let cancel = await cancellablePullPayment.callCancelPayments(payee);
    let payment2 = await cancellablePullPayment.payments(payee);
    assert.equal(payment2, 0);


    totalPayments = await cancellablePullPayment.totalPayments();
    assert.equal(totalPayments, 0);
  });

  it("should only cancels pending payments made by the caller of cancelPayments", async function() {
    let AMOUNT = 17*1e18;
    let payee = accounts[1];
    let initialBalance = web3.eth.getBalance(accounts[0]);

    let cancellablePullPayment = await CancellablePullPaymentMock.new({value: AMOUNT});
    let call1 = await cancellablePullPayment.callSend(payee, AMOUNT);
    let call2 = await cancellablePullPayment.callSend(payee, AMOUNT, {from: accounts[9]});

    let payment1 = await cancellablePullPayment.payments(payee);
    let expectedAmount = AMOUNT * 2;
    assert.equal(payment1, expectedAmount);

    let paymentsByPayer = await cancellablePullPayment.paymentsByPayer(accounts[0], payee);
    assert.equal(paymentsByPayer, AMOUNT);

    let totalPayments = await cancellablePullPayment.totalPayments();
    assert.equal(totalPayments, expectedAmount);

    let balanceAfterPayment = web3.eth.getBalance(accounts[0]);

    let cancel = await cancellablePullPayment.callCancelPayments(payee);
    let payment2 = await cancellablePullPayment.payments(payee);
    assert.equal(payment2, AMOUNT);

    let paymentsByPayer2 = await cancellablePullPayment.paymentsByPayer(accounts[0], payee);
    assert.equal(paymentsByPayer2, 0);

    totalPayments = await cancellablePullPayment.totalPayments();
    assert.equal(totalPayments, AMOUNT);


    let balanceAfterCancel = web3.eth.getBalance(accounts[0]);
    assert(initialBalance > balanceAfterCancel);
    assert(balanceAfterCancel > balanceAfterPayment);
  });
})