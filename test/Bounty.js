contract('Bounty', function(accounts) {
  before(function(){
    owner = accounts[0];
    researcher = accounts[1];
  })

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

  it("sets reward", function(done){
    var target = SecureTargetMock.deployed();
    var reward = web3.toWei(1, "ether");
    var bounty;
    SimpleTokenBounty.new(target.address).
      then(function(bounty){
        web3.eth.sendTransaction({
          from:owner,
          to:bounty.address,
          value: reward
        })
        assert.equal(reward, web3.eth.getBalance(bounty.address).toNumber())
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
