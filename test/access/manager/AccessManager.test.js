const { expectEvent, expectRevert, constants, time } = require('@openzeppelin/test-helpers');
const { selector } = require('../../helpers/methods');

const AccessManager = artifacts.require('$AccessManager');
const AccessManagedTarget = artifacts.require('$AccessManagedTarget');

const ADMIN_GROUP = 0;
const SOME_GROUP = 42;
const PUBLIC_GROUP = constants.MAX_UINT256;

contract('AccessManager', function (accounts) {
  const [admin, other] = accounts;

  beforeEach(async function () {
    this.manager = await AccessManager.new(admin);
    this.target  = await AccessManagedTarget.new(this.manager.address);
  });

  it('groups are correctly initialized', async function () {
    expect(await this.manager.hasGroup(ADMIN_GROUP, admin)).to.be.equal(true);
    expect(await this.manager.hasGroup(ADMIN_GROUP, other)).to.be.equal(false);
    expect(await this.manager.hasGroup(SOME_GROUP, admin)).to.be.equal(false);
    expect(await this.manager.hasGroup(SOME_GROUP, other)).to.be.equal(false);
    expect(await this.manager.hasGroup(PUBLIC_GROUP, admin)).to.be.equal(true);
    expect(await this.manager.hasGroup(PUBLIC_GROUP, other)).to.be.equal(true);
  });

  // describe('restricted functions', function () {
  //   describe('grantGroup', function () {
  //     it('authorized', async function () {
  //       expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP));

  //       const receipt = await this.manager.grantGroup(SOME_GROUP, other, [], { from: admin });
  //       // expectEvent(receipt, 'RoleGranted', { account: other, role: mask(SOME_GROUP), sender: admin });

  //       expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP, SOME_GROUP));
  //     });

  //     it('unauthorized', async function () {
  //       await expectRevert(
  //         this.manager.grantGroup(SOME_GROUP, other, [], { from: other }),
  //         'AccessManaged: authority rejected',
  //       );
  //     });

  //     it('revert if user already has the role', async function () {
  //       await expectRevert(
  //         this.manager.grantGroup(ADMIN_GROUP, admin, [], { from: admin }),
  //         'Grant error: user already in group',
  //       );
  //     });
  //   });

  //   describe('revokeGroup', function () {
  //     beforeEach(async function () {
  //       await this.manager.$_grantGroup(SOME_GROUP, other, []);
  //     });

  //     it('authorized', async function () {
  //       expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP, SOME_GROUP));

  //       const receipt = await this.manager.revokeGroup(SOME_GROUP, other, [], { from: admin });
  //       // expectEvent(receipt, 'RoleRevoked', { account: other, role: mask(SOME_GROUP), sender: admin });

  //       expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP));
  //     });

  //     it('unauthorized', async function () {
  //       await expectRevert(
  //         this.manager.revokeGroup(SOME_GROUP, other, [], { from: other }),
  //         'AccessManaged: authority rejected',
  //       );
  //     });

  //     it('revert if user does not have the role', async function () {
  //       await expectRevert(
  //         this.manager.revokeGroup(SOME_GROUP, admin, [], { from: admin }),
  //         'Revoke error: user not in group',
  //       );
  //     });
  //   });

  //   describe('renounceGroup', function () {
  //     beforeEach(async function () {
  //       await this.manager.$_grantGroup(SOME_GROUP, other, []);
  //     });

  //     it('authorized', async function () {
  //       expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP, SOME_GROUP));

  //       const receipt = await this.manager.renounceGroup(SOME_GROUP, [], { from: other });
  //       // expectEvent(receipt, 'RoleRevoked', { account: other, role: mask(SOME_GROUP), sender: other });

  //       expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP));
  //     });

  //     it('revert if user already has the role', async function () {
  //       await expectRevert(
  //         this.manager.renounceGroup(SOME_GROUP, [], { from: admin }),
  //         'Revoke error: user not in group',
  //       );
  //     });
  //   });
  // });

  // describe('conditions', function () {
  //   describe('delay', function () {
  //     beforeEach(async function () {
  //       this.duration = web3.utils.toBN(10);
  //       this.condition = await Condition.new(this.duration); // 0 duration

  //       // Grant admin power through the condition and revoke "normal" admin power
  //       await this.manager.grantGroup(ADMIN_GROUP, admin, [this.condition.address], { from: admin });
  //       await this.manager.renounceGroup(ADMIN_GROUP, [], { from: admin });

  //       // data of the restricted call
  //       this.call = [
  //         [this.manager.address], // targets
  //         [0], // values
  //         [this.manager.contract.methods.grantGroup(SOME_GROUP, other, []).encodeABI()], //payloads
  //         constants.ZERO_BYTES32,
  //       ];
  //       this.callid = web3.utils.keccak256(
  //         web3.eth.abi.encodeParameters(['address[]', 'uint256[]', 'bytes[]', 'bytes32'], this.call),
  //       );
  //     });

  //     it('cannot execute before schedule', async function () {
  //       await expectRevert(this.condition.execute(...this.call, { from: admin }), `ProposalNotReady("${this.callid}")`);
  //     });

  //     it('unauthorized schedule', async function () {
  //       await expectRevert(this.condition.schedule(...this.call, { from: other }), 'PrecheckFailed()');
  //     });

  //     it('schedule and execute', async function () {
  //       await this.condition.schedule(...this.call, { from: admin });
  //       await expectRevert(this.condition.execute(...this.call, { from: admin }), `ProposalNotReady("${this.callid}")`);
  //     });

  //     it('schedule, wait and execute', async function () {
  //       await this.condition.schedule(...this.call, { from: admin });
  //       await time.increase(this.duration);

  //       expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP));
  //       await this.condition.execute(...this.call, { from: admin });
  //       expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP, SOME_GROUP));
  //     });

  //     it('unauthorized execute', async function () {
  //       await this.condition.schedule(...this.call, { from: admin });
  //       await time.increase(this.duration);

  //       await expectRevert(
  //         this.condition.execute(...this.call, { from: other }),
  //         `UnauthorizedCaller("${this.callid}")`,
  //       );
  //     });
  //   });
  // });
});
