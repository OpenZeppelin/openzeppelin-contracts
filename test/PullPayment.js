contract('PullPaymentExample', function(accounts) {

  it("can't call asyncSend externally", function(done) {
    var ppc;
    return PullPaymentExample.new()
      .then(function(ppc) {
        assert.isUndefined(ppc.asyncSend);
      })
      .then(done);
  });

  it("can record an async payment correctly", function(done) {
    var ppce;
    var AMOUNT = 100;
    return PullPaymentExample.new()
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

});
