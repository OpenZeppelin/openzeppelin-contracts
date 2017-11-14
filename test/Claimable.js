'use strict';
const assertRevert = require('./helpers/assertRevert');

var Claimable = artifacts.require('../contracts/ownership/Claimable.sol');

contract('Claimable', function(accounts) {
  let claimable;

  beforeEach(async function() {
    claimable = await Claimable.new();
  });

  it('should have an owner', async function() {
    let owner = await claimable.owner();
    assert.isTrue(owner !== 0);
  });

  it('changes pendingOwner after transfer', async function() {
    let newOwner = accounts[1];
    await claimable.transferOwnership(newOwner);
    let pendingOwner = await claimable.pendingOwner();

    assert.isTrue(pendingOwner === newOwner);
  });

  it('should prevent to claimOwnership from no pendingOwner', async function() {
    try {
      await claimable.claimOwnership({from: accounts[2]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should prevent non-owners from transfering', async function() {
    const other = accounts[2];
    const owner = await claimable.owner.call();
    assert.isTrue(owner !== other);
    try {
      await claimable.transferOwnership(other, {from: other});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  describe('after initiating a transfer', function () {
    let newOwner;

    beforeEach(async function () {
      newOwner = accounts[1];
      await claimable.transferOwnership(newOwner);
    });

    it('changes allow pending owner to claim ownership', async function() {
      await claimable.claimOwnership({from: newOwner});
      let owner = await claimable.owner();

      assert.isTrue(owner === newOwner);
    });
  });
});
