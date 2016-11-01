contract('StandardToken', function(accounts) {

  it("should return the correct allowance amount after approval", function(done) {
    var token;
    return StandardTokenMock.new()
      .then(function(_token) {
        token = _token;
        return token.approve(accounts[1], 100);
      })
      .then(function() {
        return token.allowance(accounts[0], accounts[1]);
      })
      .then(function(allowance) {
        assert.equal(allowance, 100);
      })
      .then(done);
  });

  it("should return correct balances after transfer", function(done) {
    var token;
    return StandardTokenMock.new(accounts[0], 100)
      .then(function(_token) {
        token = _token;
        return token.transfer(accounts[1], 100);
      })
      .then(function() {
        return token.balanceOf(accounts[0]);
      })
      .then(function(balance) {
        assert.equal(balance, 0);
      })
      .then(function() {
        return token.balanceOf(accounts[1]);
      })
      .then(function(balance) {
        assert.equal(balance, 100);
      })
      .then(done);
  });

  it("should throw an error when trying to transfer more than balance", function(done) {
    var token;
    return StandardTokenMock.new(accounts[0], 100)
      .then(function(_token) {
        token = _token;
        return token.transfer(accounts[1], 101);
      })
      .catch(function(error) {
        if (error.message.search('invalid JUMP') == -1) throw error
      })
      .then(done);
  });

  it("should return correct balances after transfering from another account", function(done) {
    var token;
    return StandardTokenMock.new(accounts[0], 100)
      .then(function(_token) {
        token = _token;
        return token.approve(accounts[1], 100);
      })
      .then(function() {
        return token.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});
      })
      .then(function() {
        return token.balanceOf(accounts[0]);
      })
      .then(function(balance) {
        assert.equal(balance, 0);
        return token.balanceOf(accounts[2]);
      })
      .then(function(balance) {
        assert.equal(balance, 100)
        return token.balanceOf(accounts[1]);
      })
      .then(function(balance) {
        assert.equal(balance, 0);
      })
      .then(done);
  });

  it("should throw an error when trying to transfer more than allowed", function(done) {
    var token;
    return StandardTokenMock.new(accounts[0], 100)
      .then(function(_token) {
        token = _token;
        return token.approve(accounts[1], 99);
      })
      .then(function() {
        return token.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});
      })
      .catch(function(error) {
        if (error.message.search('invalid JUMP') == -1) throw error
      })
      .then(done);
  });

});
