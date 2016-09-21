contract('Ownable', function(accounts) {

  var ownable;

  before(function() {
    ownable = Ownable.deployed();
  });

  it("should have an owner", function(done) {
    return ownable.owner()
    .then(function(owner) {
      assert.isTrue(owner != 0);
    })
    .then(done)
  });

  it("changes owner after transfer", function(done) {
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

  it("should prevent non-owners from transfering", function(done) {
    var other = accounts[2];

    return ownable.transfer(other, {from: other})
    .then(function() {
      return ownable.owner();
    })
    .then(function(owner) {
      assert.isFalse(owner === other);
    })
    .then(done)
  });

});
