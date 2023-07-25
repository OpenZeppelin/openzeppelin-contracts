const { expectEvent, expectRevert, constants, time } = require('@openzeppelin/test-helpers');
const { expectRevertCustomError } = require('../../helpers/customError');
const { Enum } = require('../../helpers/enums');
const { selector } = require('../../helpers/methods');
const { clockFromReceipt } = require('../../helpers/time');

const AccessManager = artifacts.require('$AccessManager');
const AccessManagedTarget = artifacts.require('$AccessManagedTarget');

const AccessMode = Enum('Custom', 'Closed', 'Open');

const ADMIN_GROUP = web3.utils.toBN(0);
const MY_GROUP_ADMIN = web3.utils.toBN(17);
const MY_GROUP = web3.utils.toBN(42);
const PUBLIC_GROUP = constants.MAX_UINT256;

const executeDelay = web3.utils.toBN(10);
const grantDelay = web3.utils.toBN(10);

contract('AccessManager', function (accounts) {
  const [admin, manager, member, other] = accounts;

  beforeEach(async function () {
    this.manager = await AccessManager.new(admin);
    this.target = await AccessManagedTarget.new(this.manager.address);

    // add member to group
    await this.manager.$_setGroupAdmin(MY_GROUP, MY_GROUP_ADMIN);
    await this.manager.$_grantRole(MY_GROUP_ADMIN, manager, 0, 0);
    await this.manager.$_grantRole(MY_GROUP, member, 0, 0);
  });

  it('groups are correctly initialized', async function () {
    // group admin
    expect(await this.manager.getGroupAdmin(ADMIN_GROUP)).to.be.bignumber.equal(ADMIN_GROUP);
    expect(await this.manager.getGroupAdmin(MY_GROUP_ADMIN)).to.be.bignumber.equal(ADMIN_GROUP);
    expect(await this.manager.getGroupAdmin(MY_GROUP)).to.be.bignumber.equal(MY_GROUP_ADMIN);
    expect(await this.manager.getGroupAdmin(PUBLIC_GROUP)).to.be.bignumber.equal(ADMIN_GROUP);
    // group guardian
    expect(await this.manager.getGroupGuardian(ADMIN_GROUP)).to.be.bignumber.equal(ADMIN_GROUP);
    expect(await this.manager.getGroupGuardian(MY_GROUP_ADMIN)).to.be.bignumber.equal(ADMIN_GROUP);
    expect(await this.manager.getGroupGuardian(MY_GROUP)).to.be.bignumber.equal(ADMIN_GROUP);
    expect(await this.manager.getGroupGuardian(PUBLIC_GROUP)).to.be.bignumber.equal(ADMIN_GROUP);
    // group members
    expect(await this.manager.hasGroup(ADMIN_GROUP, admin)).to.be.equal(true);
    expect(await this.manager.hasGroup(ADMIN_GROUP, manager)).to.be.equal(false);
    expect(await this.manager.hasGroup(ADMIN_GROUP, member)).to.be.equal(false);
    expect(await this.manager.hasGroup(ADMIN_GROUP, other)).to.be.equal(false);
    expect(await this.manager.hasGroup(MY_GROUP_ADMIN, admin)).to.be.equal(false);
    expect(await this.manager.hasGroup(MY_GROUP_ADMIN, manager)).to.be.equal(true);
    expect(await this.manager.hasGroup(MY_GROUP_ADMIN, member)).to.be.equal(false);
    expect(await this.manager.hasGroup(MY_GROUP_ADMIN, other)).to.be.equal(false);
    expect(await this.manager.hasGroup(MY_GROUP, admin)).to.be.equal(false);
    expect(await this.manager.hasGroup(MY_GROUP, manager)).to.be.equal(false);
    expect(await this.manager.hasGroup(MY_GROUP, member)).to.be.equal(true);
    expect(await this.manager.hasGroup(MY_GROUP, other)).to.be.equal(false);
    expect(await this.manager.hasGroup(PUBLIC_GROUP, admin)).to.be.equal(true);
    expect(await this.manager.hasGroup(PUBLIC_GROUP, manager)).to.be.equal(true);
    expect(await this.manager.hasGroup(PUBLIC_GROUP, member)).to.be.equal(true);
    expect(await this.manager.hasGroup(PUBLIC_GROUP, other)).to.be.equal(true);
  });

  describe('groups management', function () {
    describe('grand role', function () {
      describe('without a grant delay', function () {
        it('without an execute delay', async function () {
          expect(await this.manager.hasGroup(MY_GROUP, other)).to.be.false;

          const { receipt } = await this.manager.grantRole(MY_GROUP, other, 0, { from: manager });
          const timestamp = await clockFromReceipt.timestamp(receipt);
          // TODO: expectEvent(receipt, 'Something', [ 'some', 'args' ]);

          expect(await this.manager.hasGroup(MY_GROUP, other)).to.be.true;

          const { delay, since } = await this.manager.getAccess(MY_GROUP, other);
          expect(delay).to.be.bignumber.equal('0');
          expect(since).to.be.bignumber.equal(timestamp.toString());
        });

        it('with an execute delay', async function () {
          expect(await this.manager.hasGroup(MY_GROUP, other)).to.be.false;

          const { receipt } = await this.manager.grantRole(MY_GROUP, other, executeDelay, { from: manager });
          const timestamp = await clockFromReceipt.timestamp(receipt);
          // TODO: expectEvent(receipt, 'Something', [ 'some', 'args' ]);

          expect(await this.manager.hasGroup(MY_GROUP, other)).to.be.true;

          const { delay, since } = await this.manager.getAccess(MY_GROUP, other);
          expect(delay).to.be.bignumber.equal(executeDelay);
          expect(since).to.be.bignumber.equal(timestamp.toString());
        });

        it('to a user that is already in the group', async function () {
          expect(await this.manager.hasGroup(MY_GROUP, member)).to.be.true;

          await expectRevertCustomError(
            this.manager.grantRole(MY_GROUP, member, 0, { from: manager }),
            'AccessManagerAcountAlreadyInGroup',
            [MY_GROUP, member],
          );
        });

        it('to a user that is scheduled for joining the group', async function () {
          await this.manager.$_grantRole(MY_GROUP, other, 10, 0); // grant delay 10

          expect(await this.manager.hasGroup(MY_GROUP, other)).to.be.false;

          await expectRevertCustomError(
            this.manager.grantRole(MY_GROUP, other, 0, { from: manager }),
            'AccessManagerAcountAlreadyInGroup',
            [MY_GROUP, other],
          );
        });

        it('grant role is restricted', async function () {
          await expectRevertCustomError(
            this.manager.grantRole(MY_GROUP, other, 0, { from: other }),
            'AccessControlUnauthorizedAccount',
            [other, MY_GROUP_ADMIN],
          );
        });
      });

      describe('with a grant delay', function () {
        beforeEach(async function () {
          await this.manager.$_setGrantDelay(MY_GROUP, grantDelay, true);
        });

        it('granted role is not active immediatly', async function () {
          const { receipt } = await this.manager.grantRole(MY_GROUP, other, 0, { from: manager });
          const timestamp = await clockFromReceipt.timestamp(receipt);
          // TODO: expectEvent(receipt, 'Something', [ 'some', 'args' ]);

          expect(await this.manager.hasGroup(MY_GROUP, other)).to.be.false;

          const { delay, since } = await this.manager.getAccess(MY_GROUP, other);
          expect(delay).to.be.bignumber.equal('0');
          expect(since).to.be.bignumber.equal(web3.utils.toBN(timestamp).add(grantDelay));
        });

        it('granted role is active after the delay', async function () {
          const { receipt } = await this.manager.grantRole(MY_GROUP, other, 0, { from: manager });
          const timestamp = await clockFromReceipt.timestamp(receipt);
          // TODO: expectEvent(receipt, 'Something', [ 'some', 'args' ]);

          await time.increase(grantDelay);

          expect(await this.manager.hasGroup(MY_GROUP, other)).to.be.true;

          const { delay, since } = await this.manager.getAccess(MY_GROUP, other);
          expect(delay).to.be.bignumber.equal('0');
          expect(since).to.be.bignumber.equal(web3.utils.toBN(timestamp).add(grantDelay));
        });
      });
    });

    describe('revoke role', function () {
      it('from a user that is already in the group', async function () {
        expect(await this.manager.hasGroup(MY_GROUP, member)).to.be.true;

        const { receipt } = await this.manager.revokeRole(MY_GROUP, member, { from: manager });
        // TODO: expectEvent(receipt, 'Something', [ 'some', 'args' ]);

        expect(await this.manager.hasGroup(MY_GROUP, member)).to.be.false;

        const { delay, since } = await this.manager.getAccess(MY_GROUP, other);
        expect(delay).to.be.bignumber.equal('0');
        expect(since).to.be.bignumber.equal('0');
      });

      it('from a user that is scheduled for joining the group', async function () {
        await this.manager.$_grantRole(MY_GROUP, other, 10, 0); // grant delay 10

        expect(await this.manager.hasGroup(MY_GROUP, other)).to.be.false;

        const { receipt } = await this.manager.revokeRole(MY_GROUP, other, { from: manager });
        // TODO: expectEvent(receipt, 'Something', [ 'some', 'args' ]);

        expect(await this.manager.hasGroup(MY_GROUP, other)).to.be.false;

        const { delay, since } = await this.manager.getAccess(MY_GROUP, other);
        expect(delay).to.be.bignumber.equal('0');
        expect(since).to.be.bignumber.equal('0');
      });

      it('from a user that is not in the group', async function () {
        expect(await this.manager.hasGroup(MY_GROUP, other)).to.be.false;

        await expectRevertCustomError(
          this.manager.revokeRole(MY_GROUP, other, { from: manager }),
          'AccessManagerAcountNotInGroup',
          [MY_GROUP, other],
        );
      });

      it('revoke role is restricted', async function () {
        await expectRevertCustomError(
          this.manager.revokeRole(MY_GROUP, member, { from: other }),
          'AccessControlUnauthorizedAccount',
          [other, MY_GROUP_ADMIN],
        );
      });
    });

    describe('renounce role', function () {
      it('for a user that is already in the group', async function () {
        expect(await this.manager.hasGroup(MY_GROUP, member)).to.be.true;

        const { receipt } = await this.manager.renounceRole(MY_GROUP, member, { from: member });
        // TODO: expectEvent(receipt, 'Something', [ 'some', 'args' ]);

        expect(await this.manager.hasGroup(MY_GROUP, member)).to.be.false;

        const { delay, since } = await this.manager.getAccess(MY_GROUP, member);
        expect(delay).to.be.bignumber.equal('0');
        expect(since).to.be.bignumber.equal('0');
      });

      it('for a user that is schedule for joining the group', async function () {
        await this.manager.$_grantRole(MY_GROUP, other, 10, 0); // grant delay 10

        expect(await this.manager.hasGroup(MY_GROUP, other)).to.be.false;

        const { receipt } = await this.manager.renounceRole(MY_GROUP, other, { from: other });
        // TODO: expectEvent(receipt, 'Something', [ 'some', 'args' ]);

        expect(await this.manager.hasGroup(MY_GROUP, other)).to.be.false;

        const { delay, since } = await this.manager.getAccess(MY_GROUP, other);
        expect(delay).to.be.bignumber.equal('0');
        expect(since).to.be.bignumber.equal('0');
      });

      it('for a user that is not in the group', async function () {
        await expectRevertCustomError(
          this.manager.renounceRole(MY_GROUP, other, { from: other }),
          'AccessManagerAcountNotInGroup',
          [MY_GROUP, other],
        );
      });

      it('bad user confirmation', async function () {
        await expectRevertCustomError(
          this.manager.renounceRole(MY_GROUP, member, { from: other }),
          'AccessManagerBadConfirmation',
          [],
        );
      });
    });

    describe('change group admin', function () {});
    describe('change group guardian', function () {});
    describe('change execution delay', function () {});
    describe('change grant delay', function () {});
  });

  // describe('calling managed contract', function () {
  //   describe('without a delay', function () {
  //     for (const [ modeName, mode] of Object.entries(AccessMode)) {

  //       describe(`mode: ${modeName}`, function () {
  //         beforeEach(async function () {
  //           await this.manager[`setContractMode${modeName}`](this.target.address);
  //         });

  //         it ('', async function () {
  //           expect(await this.manager.getContractMode(this.target.address)).to.be.bignumber.equal(mode);
  //         });

  //       });

  //     }
  //   });
  // });

  // describe('restricted functions', function () {
  //   describe('grantGroup', function () {
  //     it('authorized', async function () {
  //       expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP));

  //       const receipt = await this.manager.grantGroup(MY_GROUP, other, [], { from: admin });
  //       // expectEvent(receipt, 'RoleGranted', { account: other, role: mask(MY_GROUP), sender: admin });

  //       expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP, MY_GROUP));
  //     });

  //     it('unauthorized', async function () {
  //       await expectRevert(
  //         this.manager.grantGroup(MY_GROUP, other, [], { from: other }),
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
  //       await this.manager.$_grantGroup(MY_GROUP, other, []);
  //     });

  //     it('authorized', async function () {
  //       expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP, MY_GROUP));

  //       const receipt = await this.manager.revokeGroup(MY_GROUP, other, [], { from: admin });
  //       // expectEvent(receipt, 'RoleRevoked', { account: other, role: mask(MY_GROUP), sender: admin });

  //       expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP));
  //     });

  //     it('unauthorized', async function () {
  //       await expectRevert(
  //         this.manager.revokeGroup(MY_GROUP, other, [], { from: other }),
  //         'AccessManaged: authority rejected',
  //       );
  //     });

  //     it('revert if user does not have the role', async function () {
  //       await expectRevert(
  //         this.manager.revokeGroup(MY_GROUP, admin, [], { from: admin }),
  //         'Revoke error: user not in group',
  //       );
  //     });
  //   });

  //   describe('renounceGroup', function () {
  //     beforeEach(async function () {
  //       await this.manager.$_grantGroup(MY_GROUP, other, []);
  //     });

  //     it('authorized', async function () {
  //       expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP, MY_GROUP));

  //       const receipt = await this.manager.renounceGroup(MY_GROUP, [], { from: other });
  //       // expectEvent(receipt, 'RoleRevoked', { account: other, role: mask(MY_GROUP), sender: other });

  //       expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP));
  //     });

  //     it('revert if user already has the role', async function () {
  //       await expectRevert(
  //         this.manager.renounceGroup(MY_GROUP, [], { from: admin }),
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
  //         [this.manager.contract.methods.grantGroup(MY_GROUP, other, []).encodeABI()], //payloads
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
  //       expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP, MY_GROUP));
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
