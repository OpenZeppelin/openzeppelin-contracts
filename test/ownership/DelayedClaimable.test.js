const { assertRevert } = require('../helpers/assertRevert');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const DelayedClaimable = artifacts.require('DelayedClaimable');

contract('DelayedClaimable', function ([_, owner, newOwner]) {
  beforeEach(async function () {
    this.delayedClaimable = await DelayedClaimable.new({ from: owner });
  });

  it('can set claim blocks', async function () {
    await this.delayedClaimable.transferOwnership(newOwner, { from: owner });
    await this.delayedClaimable.setLimits(0, 1000, { from: owner });

    const end = await this.delayedClaimable.end();
    end.should.be.bignumber.equal(1000);

    const start = await this.delayedClaimable.start();
    start.should.be.bignumber.equal(0);
  });

  it('changes pendingOwner after transfer successful', async function () {
    await this.delayedClaimable.transferOwnership(newOwner, { from: owner });
    await this.delayedClaimable.setLimits(0, 1000, { from: owner });

    const end = await this.delayedClaimable.end();
    end.should.be.bignumber.equal(1000);

    const start = await this.delayedClaimable.start();
    start.should.be.bignumber.equal(0);

    (await this.delayedClaimable.pendingOwner()).should.eq(newOwner);
    await this.delayedClaimable.claimOwnership({ from: newOwner });
    (await this.delayedClaimable.owner()).should.eq(newOwner);
  });

  it('changes pendingOwner after transfer fails', async function () {
    await this.delayedClaimable.transferOwnership(newOwner, { from: owner });
    await this.delayedClaimable.setLimits(100, 110, { from: owner });

    const end = await this.delayedClaimable.end();
    end.should.be.bignumber.equal(110);

    const start = await this.delayedClaimable.start();
    start.should.be.bignumber.equal(100);

    (await this.delayedClaimable.pendingOwner()).should.eq(newOwner);
    await assertRevert(this.delayedClaimable.claimOwnership({ from: newOwner }));
    (await this.delayedClaimable.owner()).should.not.eq(newOwner);
  });

  it('set end and start invalid values fail', async function () {
    await this.delayedClaimable.transferOwnership(newOwner, { from: owner });
    await assertRevert(this.delayedClaimable.setLimits(1001, 1000, { from: owner }));
  });
});
