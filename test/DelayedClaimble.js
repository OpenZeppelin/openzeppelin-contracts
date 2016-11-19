contract('DelayedClaimable', function(accounts) {
  var delayedClaimable;

  beforeEach(function() {
    return DelayedClaimable.new().then(function(deployed) {
      delayedClaimable = deployed;
    });
  });

  it("changes pendingOwner after transfer succesful", function(done) {
    var newOwner = accounts[2];
    return delayedClaimable.transfer(newOwner)
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
        assert.isTrue(pendingOwner === newOwner);
        return delayedClaimable.claimOwnership({from: newOwner});
      })
      .then(function() {
        return delayedClaimable.owner();
      })
      .then(function(owner) {
        assert.isTrue(owner === newOwner);
      })
      .then(done)
  });

  it("changes pendingOwner after transfer fails", function(done) {
    var newOwner = accounts[1];
    return delayedClaimable.transfer(newOwner)
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
        assert.isTrue(pendingOwner === newOwner);
        return delayedClaimable.claimOwnership({from: newOwner});
      })
      .then(function() {
        return delayedClaimable.owner();
      })
      .then(function(owner) {
        assert.isTrue(owner != newOwner);
      })
      .then(done)
  });

});
