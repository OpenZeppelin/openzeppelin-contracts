contract('Ownable', function(accounts) {
  it("should have an owner", function(done) {
    var ownable = Ownable.deployed();
    return ownable.owner()
      .then(function(owner) {
        assert.isTrue(owner != 0);
      })
      .then(done)
  });

  it("changes owner after transfer", function(done) {
    var ownable = Ownable.deployed();
    var other = accounts[1];
    return ownable.transfer(other)
      .then(function() {
        return ownable.owner();
      })
      .then(function(owner) {
        assert.isTrue(owner === other);
      })
      .then(done)
  });

  it("should prevent non-owners from transfering" ,function(done) {
    var ownable = Ownable.deployed();
    var other = accounts[2];
    return ownable.transfer(other, {from: accounts[2]})
      .then(function() {
        return ownable.owner();
      })
      .then(function(owner) {
        assert.isFalse(owner === other);
      })
      .then(done)
  });

});
