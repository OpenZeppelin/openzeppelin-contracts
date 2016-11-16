contract('BasicToken', function(accounts) {

  it("should return the correct totalSupply after construction", function(done) {
    return BasicTokenMock.new(accounts[0], 100)
      .then(function(token) {
        return token.totalSupply();
      })
      .then(function(totalSupply) {
        assert.equal(totalSupply, 100);
      })
      .then(done);
  })

  it("should return correct balances after transfer", function(done) {
    var token;
    return BasicTokenMock.new(accounts[0], 100)
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
    return BasicTokenMock.new(accounts[0], 100)
      .then(function(_token) {
        token = _token;
        return token.transfer(accounts[1], 101);
      })
      .catch(function(error) {
        if (error.message.search('invalid JUMP') == -1) throw error
      })
      .then(done);
  });

});
