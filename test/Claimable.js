contract('Claimable', function(accounts) {
  var claimable;

  beforeEach(function() {
    return Claimable.new().then(function(deployed) {
      claimable = deployed;
    });
  });

  it("should have an owner", function(done) {
    return claimable.owner()
      .then(function(owner) {
        assert.isTrue(owner != 0);
      })
      .then(done)
  });

  it("changes pendingOwner after transfer", function(done) {
    var newOwner = accounts[1];
    return claimable.transfer(newOwner)
      .then(function() {
        return claimable.pendingOwner();
      })
      .then(function(pendingOwner) {
        assert.isTrue(pendingOwner === newOwner);
      })
      .then(done)
  });

  it("should prevent to claimOwnership from no pendingOwner", function(done) {
    return claimable.claimOwnership({from: accounts[2]})
      .then(function() {
        return claimable.owner();
      })
      .then(function(owner) {
        assert.isTrue(owner != accounts[2]);
      })
      .then(done)
  });

  it("should prevent non-owners from transfering" ,function(done) {
    return claimable.transfer(accounts[2], {from: accounts[2]})
      .then(function() {
        return claimable.pendingOwner();
      })
      .then(function(pendingOwner) {
        assert.isFalse(pendingOwner === accounts[2]);
      })
      .then(done)
  });

  describe("after initiating a transfer", function () {
    var newOwner;

    beforeEach(function () {
      newOwner = accounts[1];
      return claimable.transfer(newOwner);
    });

    it("changes allow pending owner to claim ownership", function(done) {
      return claimable.claimOwnership({from: newOwner})
        .then(function() {
          return claimable.owner();
        })
        .then(function(owner) {
          assert.isTrue(owner === newOwner);
        })
        .then(done)
    });
  });
});
