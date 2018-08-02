const { increaseTime } = require('./helpers/increaseTime');
const { expectThrow } = require('./helpers/expectThrow');
const { assertRevert } = require('./helpers/assertRevert');

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

const Heritable = artifacts.require('Heritable');

contract('Heritable', function ([_, owner, heir, anyone]) {
  let heritable;

  beforeEach(async function () {
    heritable = await Heritable.new(4141, { from: owner });
  });

  it('should start off with an owner, but without heir', async function () {
    const heir = await heritable.heir();

    assert.equal(typeof (owner), 'string');
    assert.equal(typeof (heir), 'string');
    assert.notStrictEqual(
      owner, NULL_ADDRESS,
      'Owner shouldn\'t be the null address'
    );
    assert.isTrue(
      heir === NULL_ADDRESS,
      'Heir should be the null address'
    );
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
    assert.equal(await heritable.heir(), heir);

    await heritable.removeHeir({ from: owner });
    assert.equal(await heritable.heir(), NULL_ADDRESS);
  });

  it('heir can claim ownership only if owner is dead and timeout was reached', async function () {
    await heritable.setHeir(heir, { from: owner });
    await expectThrow(heritable.claimHeirOwnership({ from: heir }));

    await heritable.proclaimDeath({ from: heir });
    await increaseTime(1);
    await expectThrow(heritable.claimHeirOwnership({ from: heir }));

    await increaseTime(4141);
    await heritable.claimHeirOwnership({ from: heir });
    assert.isTrue(await heritable.heir() === heir);
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
    await increaseTime(4141);
    await heritable.heartbeat({ from: owner });
    await expectThrow(heritable.claimHeirOwnership({ from: heir }));
  });

  it('should log events appropriately', async function () {
    const setHeirLogs = (await heritable.setHeir(heir, { from: owner })).logs;
    const setHeirEvent = setHeirLogs.find(e => e.event === 'HeirChanged');

    assert.isTrue(setHeirEvent.args.owner === owner);
    assert.isTrue(setHeirEvent.args.newHeir === heir);

    const heartbeatLogs = (await heritable.heartbeat({ from: owner })).logs;
    const heartbeatEvent = heartbeatLogs.find(e => e.event === 'OwnerHeartbeated');

    assert.isTrue(heartbeatEvent.args.owner === owner);

    const proclaimDeathLogs = (await heritable.proclaimDeath({ from: heir })).logs;
    const ownerDeadEvent = proclaimDeathLogs.find(e => e.event === 'OwnerProclaimedDead');

    assert.isTrue(ownerDeadEvent.args.owner === owner);
    assert.isTrue(ownerDeadEvent.args.heir === heir);

    await increaseTime(4141);
    const claimHeirOwnershipLogs = (await heritable.claimHeirOwnership({ from: heir })).logs;
    const ownershipTransferredEvent = claimHeirOwnershipLogs.find(e => e.event === 'OwnershipTransferred');
    const heirOwnershipClaimedEvent = claimHeirOwnershipLogs.find(e => e.event === 'HeirOwnershipClaimed');

    assert.isTrue(ownershipTransferredEvent.args.previousOwner === owner);
    assert.isTrue(ownershipTransferredEvent.args.newOwner === heir);
    assert.isTrue(heirOwnershipClaimedEvent.args.previousOwner === owner);
    assert.isTrue(heirOwnershipClaimedEvent.args.newOwner === heir);
  });

  it('timeOfDeath can be queried', async function () {
    assert.equal(await heritable.timeOfDeath(), 0);
  });

  it('heartbeatTimeout can be queried', async function () {
    assert.equal(await heritable.heartbeatTimeout(), 4141);
  });
});
