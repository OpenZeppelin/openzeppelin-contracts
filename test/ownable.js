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
    var other = '0xe682569efa3752a07fdc09885007c47beee803a7';
    return ownable.transfer(other)
    .then(function() {
      return ownable.owner();
    })
    .then(function(owner) {
      assert.isTrue(owner === other);
    })
    .then(done)
  });
});
