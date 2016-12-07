contract('DelayedClaimable', function(accounts) {
  var delayedClaimable;

  beforeEach(function() {
    return DelayedClaimable.new().then(function(deployed) {
      delayedClaimable = deployed;
    });
  });

  it("changes pendingOwner after transfer succesful", function(done) {
    return delayedClaimable.transfer(accounts[2])
      .then(function(){
        return delayedClaimable.setClaimBefore(1000)
      })
      .then(function(){
        return delayedClaimable.claimBeforeBlock();
      })
      .then(function(claimBeforeBlock) {
        assert.isTrue(claimBeforeBlock == 1000);
        return delayedClaimable.pendingOwner();
      })
      .then(function(pendingOwner) {
        assert.isTrue(pendingOwner === accounts[2]);
        return delayedClaimable.claimOwnership({from: accounts[2]});
      })
      .then(function() {
        return delayedClaimable.owner();
      })
      .then(function(owner) {
        assert.isTrue(owner === accounts[2]);
      })
      .then(done)
  });

  it("changes pendingOwner after transfer fails", function(done) {
    return delayedClaimable.transfer(accounts[1])
      .then(function(){
        return delayedClaimable.setClaimBefore(1)
      })
      .then(function(){
        return delayedClaimable.claimBeforeBlock();
      })
      .then(function(claimBeforeBlock) {
        assert.isTrue(claimBeforeBlock == 1);
        return delayedClaimable.pendingOwner();
      })
      .then(function(pendingOwner) {
        assert.isTrue(pendingOwner === accounts[1]);
        return delayedClaimable.claimOwnership({from: accounts[1]});
      })
      .catch(function(error) {
        if (error.message.search('invalid JUMP') == -1) throw error
      })
      .then(function() {
        return delayedClaimable.owner();
      })
      .then(function(owner) {
        assert.isTrue(owner != accounts[1]);
      })
      .then(done)
  });

});
