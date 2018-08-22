const { increaseTime } = require('./helpers/increaseTime');
const { expectThrow } = require('./helpers/expectThrow');
const { assertRevert } = require('./helpers/assertRevert');

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

const Heritable = artifacts.require('Heritable');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('Heritable', function ([_, owner, heir, anyone]) {
  const heartbeatTimeout = 4141;
  let heritable;

  beforeEach(async function () {
    heritable = await Heritable.new(heartbeatTimeout, { from: owner });
  });

  it('should start off with an owner, but without heir', async function () {
    const heir = await heritable.heir();

    owner.should.be.a('string').that.is.not.equal(NULL_ADDRESS);
    heir.should.be.a('string').that.is.equal(NULL_ADDRESS);
  });

  it('only owner should set heir', async function () {
    await heritable.setHeir(heir, { from: owner });
    await expectThrow(heritable.setHeir(heir, { from: anyone }));
  });

  it('owner can\'t be heir', async function () {
    await assertRevert(heritable.setHeir(owner, { from: owner }));
  });

  it('owner can remove heir', async function () {
    await heritable.setHeir(heir, { from: owner });
    (await heritable.heir()).should.equal(heir);

    await heritable.removeHeir({ from: owner });
    (await heritable.heir()).should.equal(NULL_ADDRESS);
  });

  it('heir can claim ownership only if owner is dead and timeout was reached', async function () {
    await heritable.setHeir(heir, { from: owner });
    await expectThrow(heritable.claimHeirOwnership({ from: heir }));

    await heritable.proclaimDeath({ from: heir });
    await increaseTime(1);
    await expectThrow(heritable.claimHeirOwnership({ from: heir }));

    await increaseTime(heartbeatTimeout);
    await heritable.claimHeirOwnership({ from: heir });
    (await heritable.heir()).should.equal(heir);
  });

  it('only heir can proclaim death', async function () {
    await assertRevert(heritable.proclaimDeath({ from: owner }));
    await assertRevert(heritable.proclaimDeath({ from: anyone }));
  });

  it('heir can\'t proclaim death if owner is death', async function () {
    await heritable.setHeir(heir, { from: owner });
    await heritable.proclaimDeath({ from: heir });
    await assertRevert(heritable.proclaimDeath({ from: heir }));
  });

  it('heir can\'t claim ownership if owner heartbeats', async function () {
    await heritable.setHeir(heir, { from: owner });

    await heritable.proclaimDeath({ from: heir });
    await heritable.heartbeat({ from: owner });
    await expectThrow(heritable.claimHeirOwnership({ from: heir }));

    await heritable.proclaimDeath({ from: heir });
    await increaseTime(heartbeatTimeout);
    await heritable.heartbeat({ from: owner });
    await expectThrow(heritable.claimHeirOwnership({ from: heir }));
  });

  it('should log events appropriately', async function () {
    const setHeirLogs = (await heritable.setHeir(heir, { from: owner })).logs;
    const setHeirEvent = setHeirLogs.find(e => e.event === 'HeirChanged');

    setHeirEvent.args.owner.should.equal(owner);
    setHeirEvent.args.newHeir.should.equal(heir);

    const heartbeatLogs = (await heritable.heartbeat({ from: owner })).logs;
    const heartbeatEvent = heartbeatLogs.find(e => e.event === 'OwnerHeartbeated');

    heartbeatEvent.args.owner.should.equal(owner);

    const proclaimDeathLogs = (await heritable.proclaimDeath({ from: heir })).logs;
    const ownerDeadEvent = proclaimDeathLogs.find(e => e.event === 'OwnerProclaimedDead');

    ownerDeadEvent.args.owner.should.equal(owner);
    ownerDeadEvent.args.heir.should.equal(heir);

    await increaseTime(heartbeatTimeout);
    const claimHeirOwnershipLogs = (await heritable.claimHeirOwnership({ from: heir })).logs;
    const ownershipTransferredEvent = claimHeirOwnershipLogs.find(e => e.event === 'OwnershipTransferred');
    const heirOwnershipClaimedEvent = claimHeirOwnershipLogs.find(e => e.event === 'HeirOwnershipClaimed');

    ownershipTransferredEvent.args.previousOwner.should.equal(owner);
    ownershipTransferredEvent.args.newOwner.should.equal(heir);
    heirOwnershipClaimedEvent.args.previousOwner.should.equal(owner);
    heirOwnershipClaimedEvent.args.newOwner.should.equal(heir);
  });

  it('timeOfDeath can be queried', async function () {
    (await heritable.timeOfDeath()).should.be.bignumber.equal(0);
  });

  it('heartbeatTimeout can be queried', async function () {
    (await heritable.heartbeatTimeout()).should.be.bignumber.equal(heartbeatTimeout);
  });
});
