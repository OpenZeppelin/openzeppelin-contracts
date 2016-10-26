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

  describe("SecureTargetMock", function(){
    before(function(){
      targetFactory = SecureTargetFactory.deployed();
    })

    it("checkInvariant returns true", function(done){
      SimpleTokenBounty.new(targetFactory.address).
        then(function(_bounty) {
          bounty = _bounty;
          return bounty.createTarget();
        }).
        then(function() {
          return bounty.checkInvariant.call()
        }).
        then(function(result) {
          assert.isTrue(result);
        }).
        then(done);
    })
  })

  describe("InsecureTargetMock", function(){
    before(function(){
      targetFactory = InsecureTargetFactory.deployed();
    })

    it("checkInvariant returns false", function(done){
      SimpleTokenBounty.new(targetFactory.address).
        then(function(_bounty) {
          bounty = _bounty;
          return bounty.createTarget();
        }).
        then(function() {
          return bounty.checkInvariant.call()
        }).
        then(function(result) {
          assert.isFalse(result);
        }).
        then(done);
    })
  })
});
