contract('DelayedClaimable', function(accounts) {
  var delayedClaimable;

  beforeEach(function() {
    return DelayedClaimable.new().then(function(deployed) {
      delayedClaimable = deployed;
    });
  });

  it("Changes pendingOwner after transfer succesfull", function(done) {
    return delayedClaimable.transferOwnership(accounts[2])
      .then(function(){
        return delayedClaimable.setClaimBlocks(1000,0);
      })
      .then(function(){
        return delayedClaimable.claimBeforeBlock();
      })
      .then(function(claimBeforeBlock) {
        assert.isTrue(claimBeforeBlock == 1000);
        return delayedClaimable.claimAfterBlock();
      })
      .then(function(claimAfterBlock) {
        assert.isTrue(claimAfterBlock == 0);
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
      .then(done);
  });

  it("Changes pendingOwner after transfer fails", function(done) {
    return delayedClaimable.transferOwnership(accounts[1])
      .then(function(){
        return delayedClaimable.setClaimBlocks(11000,10000);
      })
      .then(function(){
        return delayedClaimable.claimBeforeBlock();
      })
      .then(function(claimBeforeBlock) {
        assert.isTrue(claimBeforeBlock == 11000);
        return delayedClaimable.claimAfterBlock();
      })
      .then(function(claimAfterBlock) {
        assert.isTrue(claimAfterBlock == 10000);
        return delayedClaimable.pendingOwner();
      })
      .then(function(pendingOwner) {
        assert.isTrue(pendingOwner === accounts[1]);
        return delayedClaimable.claimOwnership({from: accounts[1]});
      })
      .catch(function(error) {
        if (error.message.search('invalid JUMP') == -1) throw error;
      })
      .then(function() {
        return delayedClaimable.owner();
      })
      .then(function(owner) {
        assert.isTrue(owner != accounts[1]);
      })
      .then(done);
  });

  it("Set claimBeforeBlock and claimAfterBlock invalid values fail", function(done) {
    return delayedClaimable.transferOwnership(accounts[1])
      .then(function(){
        return delayedClaimable.setClaimBlocks(1000,10000);
      })
      .catch(function(error) {
        if (error.message.search('invalid JUMP') == -1) throw error;
      })
      .then(done);
  });

});
