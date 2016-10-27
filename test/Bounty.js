var sendReward = function(sender, receiver, value){
  web3.eth.sendTransaction({
    from:sender,
    to:receiver,
    value: value
  })
}

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

  it("sets reward", function(done){
    var target = SecureTargetMock.deployed();
    var owner = accounts[0];
    var reward = web3.toWei(1, "ether");

    SimpleTokenBounty.new(target.address).
      then(function(bounty){
        sendReward(owner, bounty.address, reward);
        assert.equal(reward, web3.eth.getBalance(bounty.address).toNumber())
      }).
      then(done);
  })

  describe("SecureTargetMock", function(){
    it("checkInvariant returns true", function(done){
      var targetFactory = SecureTargetFactory.deployed();
      var bounty;
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

    it("cannot calim reward", function(done){
      var targetFactory = SecureTargetFactory.deployed();
      var owner = accounts[0];
      var researcher = accounts[1];
      var reward = web3.toWei(1, "ether");

      SimpleTokenBounty.new(targetFactory.address).
        then(function(bounty) {
          var event = bounty.TargetCreated({});
          event.watch(function(err, result) {
            event.stopWatching();
            if (err) { throw err }
            var targetAddress = result.args.createdAddress;
            sendReward(owner, bounty.address, reward);
            assert.equal(reward, web3.eth.getBalance(bounty.address).toNumber())
            bounty.claim(targetAddress, {from:researcher}).
              then(function(){ throw("should not come here")}).
              catch(function() {
                return bounty.claimed.call();
              }).
              then(function(result) {
                assert.isFalse(result);
                bounty.withdrawPayments({from:researcher}).
                  then(function(){ throw("should not come here")}).
                  catch(function() {
                    assert.equal(reward, web3.eth.getBalance(bounty.address).toNumber())
                    done();
                  })
              })
          })
          bounty.createTarget({from:researcher});
        })
    })
  })

  describe("InsecureTargetMock", function(){
    it("checkInvariant returns false", function(done){
      var targetFactory = InsecureTargetFactory.deployed();
      var bounty;
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

    it("calims reward", function(done){
      var targetFactory = InsecureTargetFactory.deployed();
      var owner = accounts[0];
      var researcher = accounts[1];
      var reward = web3.toWei(1, "ether");

      SimpleTokenBounty.new(targetFactory.address).
        then(function(bounty) {
          var event = bounty.TargetCreated({});
          event.watch(function(err, result) {
            event.stopWatching();
            if (err) { throw err }
            var targetAddress = result.args.createdAddress;
            sendReward(owner, bounty.address, reward);
            assert.equal(reward, web3.eth.getBalance(bounty.address).toNumber())
            bounty.claim(targetAddress, {from:researcher}).
              then(function() {
                return bounty.claimed.call();
              }).
              then(function(result) {
                assert.isTrue(result);
                return bounty.withdrawPayments({from:researcher})
              }).
              then(function() {
                assert.equal(0, web3.eth.getBalance(bounty.address).toNumber())
              }).then(done);
          })
          bounty.createTarget({from:researcher});
        })
    })
  })
});
