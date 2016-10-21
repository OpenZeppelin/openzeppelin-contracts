contract('PullPayment', function(accounts) {

  it("can't call asyncSend externally", function(done) {
    return PullPaymentMock.new()
      .then(function(ppc) {
        assert.isUndefined(ppc.asyncSend);
      })
      .then(done);
  });

  it("can record an async payment correctly", function(done) {
    var ppce;
    var AMOUNT = 100;
    return PullPaymentMock.new()
      .then(function(_ppce) {
        ppce = _ppce;
        ppce.callSend(accounts[0], AMOUNT)
      })
      .then(function() {
        return ppce.payments(accounts[0]);
      })
      .then(function(paymentsToAccount0) {
        assert.equal(paymentsToAccount0, AMOUNT);
      })
      .then(done);
  });

  it("can add multiple balances on one account", function(done) {
    var ppce;
    return PullPaymentMock.new()
      .then(function(_ppce) {
        ppce = _ppce;
        return ppce.callSend(accounts[0], 200)
      })
      .then(function() {
        return ppce.callSend(accounts[0], 300)
      })
      .then(function() {
        return ppce.payments(accounts[0]);
      })
      .then(function(paymentsToAccount0) {
        assert.equal(paymentsToAccount0, 500);
      })
      .then(done);
  });

  it("can add balances on multiple accounts", function(done) {
    var ppce;
    return PullPaymentMock.new()
      .then(function(_ppce) {
        ppce = _ppce;
        return ppce.callSend(accounts[0], 200)
      })
      .then(function() {
        return ppce.callSend(accounts[1], 300)
      })
      .then(function() {
        return ppce.payments(accounts[0]);
      })
      .then(function(paymentsToAccount0) {
        assert.equal(paymentsToAccount0, 200);
      })
      .then(function() {
        return ppce.payments(accounts[1]);
      })
      .then(function(paymentsToAccount0) {
        assert.equal(paymentsToAccount0, 300);
      })
      .then(done);
  });

  it("can withdraw payment", function(done) {
    var ppce;
    var AMOUNT = 17*1e18;
    var payee = accounts[1];
    var initialBalance = web3.eth.getBalance(payee);
    return PullPaymentMock.new({value: AMOUNT})
      .then(function(_ppce) {
        ppce = _ppce;
        return ppce.callSend(payee, AMOUNT);
      })
      .then(function() {
        return ppce.payments(payee);
      })
      .then(function(paymentsToAccount0) {
        assert.equal(paymentsToAccount0, AMOUNT);
      })
      .then(function() {
        return ppce.withdrawPayments({from: payee});
      })
      .then(function() {
        return ppce.payments(payee);
      })
      .then(function(paymentsToAccount0) {
        assert.equal(paymentsToAccount0, 0);
        var balance = web3.eth.getBalance(payee);
        assert(Math.abs(balance-initialBalance-AMOUNT) < 1e16);
      })
      .then(done);
  });

});
