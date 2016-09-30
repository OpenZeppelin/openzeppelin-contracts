contract('PullPaymentCapable', function(accounts) {

  it("can't call asyncSend externally", function(done) {
    var ppc = PullPaymentCapable.new();
    assert.isUndefined(ppc.asyncSend);
    done();
  });

  it("can record an async payment correctly", function(done) {
    var ppce;
    var AMOUNT = 1000;
    return PullPaymentCapableExample.new()
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
