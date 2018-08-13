const { assertRevert } = require('../helpers/assertRevert');

const DelayedClaimable = artifacts.require('DelayedClaimable');

contract('DelayedClaimable', function ([_, owner, newOwner]) {
  beforeEach(async function () {
    this.delayedClaimable = await DelayedClaimable.new({ from: owner });
  });

  it('can set claim blocks', async function () {
    await this.delayedClaimable.transferOwnership(newOwner, { from: owner });
    await this.delayedClaimable.setLimits(0, 1000, { from: owner });
    const end = await this.delayedClaimable.end();
    assert.equal(end, 1000);
    const start = await this.delayedClaimable.start();
    assert.equal(start, 0);
  });

  it('changes pendingOwner after transfer successful', async function () {
    await this.delayedClaimable.transferOwnership(newOwner, { from: owner });
    await this.delayedClaimable.setLimits(0, 1000, { from: owner });
    const end = await this.delayedClaimable.end();
    assert.equal(end, 1000);
    const start = await this.delayedClaimable.start();
    assert.equal(start, 0);
    assert.equal((await this.delayedClaimable.pendingOwner()), newOwner);
    await this.delayedClaimable.claimOwnership({ from: newOwner });
    assert.equal((await this.delayedClaimable.owner()), newOwner);
  });

  it('changes pendingOwner after transfer fails', async function () {
    await this.delayedClaimable.transferOwnership(newOwner, { from: owner });
    await this.delayedClaimable.setLimits(100, 110, { from: owner });
    const end = await this.delayedClaimable.end();
    assert.equal(end, 110);
    const start = await this.delayedClaimable.start();
    assert.equal(start, 100);
    assert.equal((await this.delayedClaimable.pendingOwner()), newOwner);
    await assertRevert(this.delayedClaimable.claimOwnership({ from: newOwner }));
    assert.isTrue((await this.delayedClaimable.owner()) !== newOwner);
  });

  it('set end and start invalid values fail', async function () {
    await this.delayedClaimable.transferOwnership(newOwner, { from: owner });
    await assertRevert(this.delayedClaimable.setLimits(1001, 1000, { from: owner }));
  });
});
