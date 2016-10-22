contract('Bounty', function(accounts) {
  it.only("create target", function(done){
    var bounty = Bounty.deployed();

    bounty.createTarget().
      then(function() {
        return bounty.checkInvarient.call()
      }).
      then(function(result) {
        assert.isTrue(result);
      }).
      then(done);
  })
});
