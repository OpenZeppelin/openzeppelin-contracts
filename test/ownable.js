contract('Ownable', function(accounts) {
  it("should have an owner", function(done) {
    var ownable = Ownable.deployed();
    return ownable.owner()
    .then(function(owner) {
      assert.isTrue(owner != 0);
    })
    .then(done)

  });
});
