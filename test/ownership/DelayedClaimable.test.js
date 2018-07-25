const { assertRevert } = require('../helpers/assertRevert');

const DelayedClaimable = artifacts.require('DelayedClaimable');

contract('DelayedClaimable', function (accounts) {
  beforeEach(async function () {
    this.delayedClaimable = await DelayedClaimable.new();
  });

  it('can set claim blocks', async function () {
    await this.delayedClaimable.transferOwnership(accounts[2]);
    await this.delayedClaimable.setLimits(0, 1000);
    let end = await this.delayedClaimable.end();
    assert.equal(end, 1000);
    let start = await this.delayedClaimable.start();
    assert.equal(start, 0);
  });

  it('changes pendingOwner after transfer successful', async function () {
    await this.delayedClaimable.transferOwnership(accounts[2]);
    await this.delayedClaimable.setLimits(0, 1000);
    let end = await this.delayedClaimable.end();
    assert.equal(end, 1000);
    let start = await this.delayedClaimable.start();
    assert.equal(start, 0);
    let pendingOwner = await this.delayedClaimable.pendingOwner();
    assert.equal(pendingOwner, accounts[2]);
    await this.delayedClaimable.claimOwnership({ from: accounts[2] });
    let owner = await this.delayedClaimable.owner();
    assert.equal(owner, accounts[2]);
  });

  it('changes pendingOwner after transfer fails', async function () {
    await this.delayedClaimable.transferOwnership(accounts[1]);
    await this.delayedClaimable.setLimits(100, 110);
    let end = await this.delayedClaimable.end();
    assert.equal(end, 110);
    let start = await this.delayedClaimable.start();
    assert.equal(start, 100);
    let pendingOwner = await this.delayedClaimable.pendingOwner();
    assert.equal(pendingOwner, accounts[1]);
    await assertRevert(this.delayedClaimable.claimOwnership({ from: accounts[1] }));
    let owner = await this.delayedClaimable.owner();
    assert.isTrue(owner !== accounts[1]);
  });

  it('set end and start invalid values fail', async function () {
    await this.delayedClaimable.transferOwnership(accounts[1]);
    await assertRevert(this.delayedClaimable.setLimits(1001, 1000));
  });
});
