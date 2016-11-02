contract('Claimable', function(accounts) {

  it("should have an owner", function(done) {
    var claimable = Claimable.deployed();
    return claimable.owner()
      .then(function(owner) {
        assert.isTrue(owner != 0);
      })
      .then(done)
  });

  it("changes pendingOwner after transfer", function(done) {
    var claimable = Claimable.deployed();
    return claimable.transfer(accounts[1])
      .then(function() {
        return claimable.pendingOwner();
      })
      .then(function(pendingOwner) {
        assert.isTrue(pendingOwner === accounts[1]);
      })
      .then(done)
  });

  it("should prevent to claimOwnership from no pendingOwner", function(done) {
    var claimable = Claimable.deployed();
    return claimable.claimOwnership({from: accounts[2]})
      .then(function() {
        return claimable.owner();
      })
      .then(function(owner) {
        assert.isTrue(owner != accounts[2]);
      })
      .then(done)
  });

  it("changes allow pending owner to claim ownership", function(done) {
    var claimable = Claimable.deployed();
    return claimable.claimOwnership({from: accounts[1]})
      .then(function() {
        return claimable.owner();
      })
      .then(function(owner) {
        assert.isTrue(owner === accounts[1]);
      })
      .then(done)
  });

  it("should prevent non-owners from transfering" ,function(done) {
    var claimable = Claimable.deployed();
    return claimable.transfer(accounts[2], {from: accounts[2]})
      .then(function() {
        return claimable.pendingOwner();
      })
      .then(function(pendingOwner) {
        assert.isFalse(pendingOwner === accounts[2]);
      })
      .then(done)
  });

});
