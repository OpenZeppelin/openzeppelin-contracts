contract('LimitBalance', function(accounts) {
  var lb;

  beforeEach(function() {
    return LimitBalanceMock.new().then(function(deployed) {
      lb = deployed;
    });
  });

  var LIMIT = 1000;

  it("should expose limit", function(done) {
    return lb.limit()
      .then(function(limit) { 
        assert.equal(limit, LIMIT);
      })
      .then(done)
  });

  it("should allow sending below limit", function(done) {
    var amount = 1;
    return lb.limitedDeposit({value: amount})
      .then(function() { 
        assert.equal(web3.eth.getBalance(lb.address), amount);
      })
      .then(done)
  });

  it("shouldnt allow sending above limit", function(done) {
    var amount = 1100;
    return lb.limitedDeposit({value: amount})
      .catch(function(error) {
        if (error.message.search('invalid JUMP') == -1) throw error
      })
      .then(done)
  });

  it("should allow multiple sends below limit", function(done) {
    var amount = 500;
    return lb.limitedDeposit({value: amount})
      .then(function() { 
        assert.equal(web3.eth.getBalance(lb.address), amount);
        return lb.limitedDeposit({value: amount})
      })
      .then(function() { 
        assert.equal(web3.eth.getBalance(lb.address), amount*2);
      })
      .then(done)
  });

  it("shouldnt allow multiple sends above limit", function(done) {
    var amount = 500;
    return lb.limitedDeposit({value: amount})
      .then(function() { 
        assert.equal(web3.eth.getBalance(lb.address), amount);
        return lb.limitedDeposit({value: amount+1})
      })
      .catch(function(error) {
        if (error.message.search('invalid JUMP') == -1) throw error;
      })
      .then(done)
  });

});
