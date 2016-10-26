contract('Bounty', function(accounts) {
  it("can create bounty contract with factory address", function(done){
    var target = SecureTargetMock.deployed();
    SimpleTokenBounty.new(target.address).
      then(function(bounty){
        return bounty.factoryAddress.call()
      }).
      then(function(address){
        assert.equal(address, target.address)
      }).
      then(done);
  })

  it.only("can call checkInvariant for SecureTargetMock", function(done){
    var bounty;
    var target = SecureTargetMock.deployed();
    SimpleTokenBounty.new(target.address).
      then(function(_bounty) {
        bounty = _bounty;
        return bounty.createTarget.sendTransaction({gas:200000});
      }).
      // then(function() {
      //   return bounty.checkInvariant.call()
      // }).
      then(function(result) {
        assert.isTrue(result);
      }).
      then(done);
  })

  it("can call checkInvariant for InsecureTargetMock", function(done){
    var bounty = SimpleTokenBounty.deployed();
    var target = InsecureTargetMock.deployed();
    bounty.createTarget(target.address).
      then(function() {
        return bounty.checkInvariant.call()
      }).
      then(function(result) {
        assert.isFalse(result);
      }).
      then(done);
  })
});
