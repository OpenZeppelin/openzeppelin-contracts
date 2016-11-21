var sendReward = function(sender, receiver, value){
  web3.eth.sendTransaction({
    from:sender,
    to:receiver,
    value: value
  })
}

contract('Bounty', function(accounts) {

  it("sets reward", function(done){
    var owner = accounts[0];
    var reward = web3.toWei(1, "ether");

    SecureTargetBounty.new().
      then(function(bounty){
        sendReward(owner, bounty.address, reward);
        assert.equal(reward, web3.eth.getBalance(bounty.address).toNumber())
      }).
      then(done);
  })

  it("empties itself when killed", function(done){
    var owner = accounts[0];
    var reward = web3.toWei(1, "ether");
    var bounty;

    SecureTargetBounty.new().
      then(function(_bounty){
        bounty = _bounty;
        sendReward(owner, bounty.address, reward);
        assert.equal(reward, web3.eth.getBalance(bounty.address).toNumber())
        return bounty.kill()
      }).
      then(function(){
        assert.equal(0, web3.eth.getBalance(bounty.address).toNumber())
      }).
      then(done);
  })

  describe("Against secure contract", function(){
    it("checkInvariant returns true", function(done){
      var bounty;

      SecureTargetBounty.new().
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

    it("cannot claim reward", function(done){
      var owner = accounts[0];
      var researcher = accounts[1];
      var reward = web3.toWei(1, "ether");

      SecureTargetBounty.new().
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

  describe("Against broken contract", function(){
    it("checkInvariant returns false", function(done){
      var bounty;

      InsecureTargetBounty.new().
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

    it("claims reward", function(done){
      var owner = accounts[0];
      var researcher = accounts[1];
      var reward = web3.toWei(1, "ether");

      InsecureTargetBounty.new().
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
