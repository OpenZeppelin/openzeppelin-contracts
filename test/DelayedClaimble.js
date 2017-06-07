'use strict';

var DelayedClaimable = artifacts.require('../contracts/ownership/DelayedClaimable.sol');

contract('DelayedClaimable', function(accounts) {
  var delayedClaimable;

  beforeEach(function() {
    return DelayedClaimable.new().then(function(deployed) {
      delayedClaimable = deployed;
    });
  });

  it('can set claim blocks', async function() {
    await delayedClaimable.transferOwnership(accounts[2]);
    await delayedClaimable.setLimits(0, 1000);
    let end = await delayedClaimable.end();
    assert.equal(end, 1000);
    let start = await delayedClaimable.start();
    assert.equal(start, 0);
  });

  it('changes pendingOwner after transfer successful', async function() {
    await delayedClaimable.transferOwnership(accounts[2]);
    await delayedClaimable.setLimits(0, 1000);
    let end = await delayedClaimable.end();
    assert.equal(end, 1000);
    let start = await delayedClaimable.start();
    assert.equal(start, 0);
    let pendingOwner = await delayedClaimable.pendingOwner();
    assert.equal(pendingOwner, accounts[2]);
    await delayedClaimable.claimOwnership({from: accounts[2]});
    let owner = await delayedClaimable.owner();
    assert.equal(owner, accounts[2]);
  });

  it('changes pendingOwner after transfer fails', async function() {
    await delayedClaimable.transferOwnership(accounts[1]);
    await delayedClaimable.setLimits(100, 110);
    let end = await delayedClaimable.end();
    assert.equal(end, 110);
    let start = await delayedClaimable.start();
    assert.equal(start, 100);
    let pendingOwner = await delayedClaimable.pendingOwner();
    assert.equal(pendingOwner, accounts[1]);
    var err = null;
    try {
      await delayedClaimable.claimOwnership({from: accounts[1]});
    } catch (error) {
      err = error;
    }
    assert.isFalse(err.message.search('invalid opcode') === -1);
    let owner = await delayedClaimable.owner();
    assert.isTrue(owner !== accounts[1]);
  });

  it('set end and start invalid values fail', async function() {
    await delayedClaimable.transferOwnership(accounts[1]);
    var err = null;
    try {
      await delayedClaimable.setLimits(1001, 1000);
    } catch (error) {
      err = error;
    }
    assert.isFalse(err.message.search('invalid opcode') === -1);
  });

});
