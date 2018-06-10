var CancellablePullPaymentMock = artifacts.require('CancellablePullPaymentMock');

const EVMThrow = require('../helpers/EVMThrow.js');

contract('CancellablePullPayment', function (accounts) {
  let mock;
  let amount = 17 * 1e18;

  const [
    payee1,
    payee2,
  ] = accounts;

  beforeEach(async function () {
    mock = await CancellablePullPaymentMock.new({ value: amount });
  });

  it('can\'t call cancelPayment externally', async function () {
    assert.isUndefined(mock.cancelPayment);
  });

  it('can cancel a payment correctly when there are payments for different addresses', async function () {
    await mock.callSend(payee1, 100);
    await mock.callSend(payee2, 200);

    const totalPayments = await mock.totalPayments();
    assert.equal(totalPayments, 300);

    const paymentsToPayee1 = await mock.payments(payee1);
    assert.equal(paymentsToPayee1, 100);

    const paymentsToPayee2 = await mock.payments(payee2);
    assert.equal(paymentsToPayee2, 200);

    await mock.callCancel(payee1);

    const totalPaymentsAfterCancel = await mock.totalPayments();
    assert.equal(totalPaymentsAfterCancel, 200);

    const paymentsToPayee1AfterCancel = await mock.payments(payee1);
    assert.equal(paymentsToPayee1AfterCancel, 0);

    const paymentsToPayee2AfterCancel = await mock.payments(payee2);
    assert.equal(paymentsToPayee2AfterCancel, 200);
  });

  it('can cancel a payment correctly when there are multiple payments for the same address', async function () {
    await mock.callSend(payee1, 100);
    await mock.callSend(payee1, 200);

    const totalPayments = await mock.totalPayments();
    assert.equal(totalPayments, 300);

    const paymentsToPayee1 = await mock.payments(payee1);
    assert.equal(paymentsToPayee1, 300);

    await mock.callCancel(payee1);

    const totalPaymentsAfterCancel = await mock.totalPayments();
    assert.equal(totalPaymentsAfterCancel, 0);

    const paymentsToPayee1AfterCancel = await mock.payments(payee1);
    assert.equal(paymentsToPayee1AfterCancel, 0);
  });

  it('should not allow to cancel a non-existent payment', async () => {
    await mock.callCancel(payee1).should.be.rejectedWith(EVMThrow);
  });
});
