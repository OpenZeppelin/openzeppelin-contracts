const { web3 } = require('hardhat');
const { expectEvent, time } = require('@openzeppelin/test-helpers');
const { expectRevertCustomError } = require('../../helpers/customError');
const { selector } = require('../../helpers/methods');
const { clockFromReceipt } = require('../../helpers/time');

const AccessManager = artifacts.require('$AccessManager');
const AccessManagedTarget = artifacts.require('$AccessManagedTarget');
const Ownable = artifacts.require('$Ownable');

const MAX_UINT64 = web3.utils.toBN((2n ** 64n - 1n).toString());

const GROUPS = {
  ADMIN: web3.utils.toBN(0),
  SOME_ADMIN: web3.utils.toBN(17),
  SOME: web3.utils.toBN(42),
  PUBLIC: MAX_UINT64,
};
Object.assign(GROUPS, Object.fromEntries(Object.entries(GROUPS).map(([key, value]) => [value, key])));

const familyId = web3.utils.toBN(1);
const executeDelay = web3.utils.toBN(10);
const grantDelay = web3.utils.toBN(10);

const formatAccess = access => [access[0], access[1].toString()];

contract('AccessManager', function (accounts) {
  const [admin, manager, member, user, other] = accounts;

  beforeEach(async function () {
    this.manager = await AccessManager.new(admin);

    // add member to group
    await this.manager.$_setGroupAdmin(GROUPS.SOME, GROUPS.SOME_ADMIN);
    await this.manager.$_setGroupGuardian(GROUPS.SOME, GROUPS.SOME_ADMIN);
    await this.manager.$_grantGroup(GROUPS.SOME_ADMIN, manager, 0, 0);
    await this.manager.$_grantGroup(GROUPS.SOME, member, 0, 0);
  });

  it('groups are correctly initialized', async function () {
    // group admin
    expect(await this.manager.getGroupAdmin(GROUPS.ADMIN)).to.be.bignumber.equal(GROUPS.ADMIN);
    expect(await this.manager.getGroupAdmin(GROUPS.SOME_ADMIN)).to.be.bignumber.equal(GROUPS.ADMIN);
    expect(await this.manager.getGroupAdmin(GROUPS.SOME)).to.be.bignumber.equal(GROUPS.SOME_ADMIN);
    expect(await this.manager.getGroupAdmin(GROUPS.PUBLIC)).to.be.bignumber.equal(GROUPS.ADMIN);
    // group guardian
    expect(await this.manager.getGroupGuardian(GROUPS.ADMIN)).to.be.bignumber.equal(GROUPS.ADMIN);
    expect(await this.manager.getGroupGuardian(GROUPS.SOME_ADMIN)).to.be.bignumber.equal(GROUPS.ADMIN);
    expect(await this.manager.getGroupGuardian(GROUPS.SOME)).to.be.bignumber.equal(GROUPS.SOME_ADMIN);
    expect(await this.manager.getGroupGuardian(GROUPS.PUBLIC)).to.be.bignumber.equal(GROUPS.ADMIN);
    // group members
    expect(await this.manager.hasGroup(GROUPS.ADMIN, admin).then(formatAccess)).to.be.deep.equal([true, '0']);
    expect(await this.manager.hasGroup(GROUPS.ADMIN, manager).then(formatAccess)).to.be.deep.equal([false, '0']);
    expect(await this.manager.hasGroup(GROUPS.ADMIN, member).then(formatAccess)).to.be.deep.equal([false, '0']);
    expect(await this.manager.hasGroup(GROUPS.ADMIN, user).then(formatAccess)).to.be.deep.equal([false, '0']);
    expect(await this.manager.hasGroup(GROUPS.SOME_ADMIN, admin).then(formatAccess)).to.be.deep.equal([false, '0']);
    expect(await this.manager.hasGroup(GROUPS.SOME_ADMIN, manager).then(formatAccess)).to.be.deep.equal([true, '0']);
    expect(await this.manager.hasGroup(GROUPS.SOME_ADMIN, member).then(formatAccess)).to.be.deep.equal([false, '0']);
    expect(await this.manager.hasGroup(GROUPS.SOME_ADMIN, user).then(formatAccess)).to.be.deep.equal([false, '0']);
    expect(await this.manager.hasGroup(GROUPS.SOME, admin).then(formatAccess)).to.be.deep.equal([false, '0']);
    expect(await this.manager.hasGroup(GROUPS.SOME, manager).then(formatAccess)).to.be.deep.equal([false, '0']);
    expect(await this.manager.hasGroup(GROUPS.SOME, member).then(formatAccess)).to.be.deep.equal([true, '0']);
    expect(await this.manager.hasGroup(GROUPS.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);
    expect(await this.manager.hasGroup(GROUPS.PUBLIC, admin).then(formatAccess)).to.be.deep.equal([true, '0']);
    expect(await this.manager.hasGroup(GROUPS.PUBLIC, manager).then(formatAccess)).to.be.deep.equal([true, '0']);
    expect(await this.manager.hasGroup(GROUPS.PUBLIC, member).then(formatAccess)).to.be.deep.equal([true, '0']);
    expect(await this.manager.hasGroup(GROUPS.PUBLIC, user).then(formatAccess)).to.be.deep.equal([true, '0']);
  });

  describe('Groups management', function () {
    describe('label group', function () {
      it('admin can emit a label event', async function () {
        expectEvent(await this.manager.labelGroup(GROUPS.SOME, 'Some label', { from: admin }), 'GroupLabel', {
          groupId: GROUPS.SOME,
          label: 'Some label',
        });
      });

      it('admin can re-emit a label event', async function () {
        await this.manager.labelGroup(GROUPS.SOME, 'Some label', { from: admin });

        expectEvent(await this.manager.labelGroup(GROUPS.SOME, 'Updated label', { from: admin }), 'GroupLabel', {
          groupId: GROUPS.SOME,
          label: 'Updated label',
        });
      });

      it('emitting a label is restricted', async function () {
        await expectRevertCustomError(
          this.manager.labelGroup(GROUPS.SOME, 'Invalid label', { from: other }),
          'AccessManagerUnauthorizedAccount',
          [other, GROUPS.ADMIN],
        );
      });
    });

    describe('grant group', function () {
      describe('without a grant delay', function () {
        it('without an execute delay', async function () {
          expect(await this.manager.hasGroup(GROUPS.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);

          const { receipt } = await this.manager.grantGroup(GROUPS.SOME, user, 0, { from: manager });
          const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
          expectEvent(receipt, 'GroupGranted', { groupId: GROUPS.SOME, account: user, since: timestamp, delay: '0' });

          expect(await this.manager.hasGroup(GROUPS.SOME, user).then(formatAccess)).to.be.deep.equal([true, '0']);

          const access = await this.manager.getAccess(GROUPS.SOME, user);
          expect(access[0]).to.be.bignumber.equal(timestamp); // inGroupSince
          expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
          expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
          expect(access[3]).to.be.bignumber.equal('0'); // effect
        });

        it('with an execute delay', async function () {
          expect(await this.manager.hasGroup(GROUPS.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);

          const { receipt } = await this.manager.grantGroup(GROUPS.SOME, user, executeDelay, { from: manager });
          const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
          expectEvent(receipt, 'GroupGranted', {
            groupId: GROUPS.SOME,
            account: user,
            since: timestamp,
            delay: executeDelay,
          });

          expect(await this.manager.hasGroup(GROUPS.SOME, user).then(formatAccess)).to.be.deep.equal([
            true,
            executeDelay.toString(),
          ]);

          const access = await this.manager.getAccess(GROUPS.SOME, user);
          expect(access[0]).to.be.bignumber.equal(timestamp); // inGroupSince
          expect(access[1]).to.be.bignumber.equal(executeDelay); // currentDelay
          expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
          expect(access[3]).to.be.bignumber.equal('0'); // effect
        });

        it('to a user that is already in the group', async function () {
          expect(await this.manager.hasGroup(GROUPS.SOME, member).then(formatAccess)).to.be.deep.equal([true, '0']);

          await expectRevertCustomError(
            this.manager.grantGroup(GROUPS.SOME, member, 0, { from: manager }),
            'AccessManagerAccountAlreadyInGroup',
            [GROUPS.SOME, member],
          );
        });

        it('to a user that is scheduled for joining the group', async function () {
          await this.manager.$_grantGroup(GROUPS.SOME, user, 10, 0); // grant delay 10

          expect(await this.manager.hasGroup(GROUPS.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);

          await expectRevertCustomError(
            this.manager.grantGroup(GROUPS.SOME, user, 0, { from: manager }),
            'AccessManagerAccountAlreadyInGroup',
            [GROUPS.SOME, user],
          );
        });

        it('grant group is restricted', async function () {
          await expectRevertCustomError(
            this.manager.grantGroup(GROUPS.SOME, user, 0, { from: other }),
            'AccessManagerUnauthorizedAccount',
            [other, GROUPS.SOME_ADMIN],
          );
        });
      });

      describe('with a grant delay', function () {
        beforeEach(async function () {
          await this.manager.$_setGrantDelay(GROUPS.SOME, grantDelay);
        });

        it('granted group is not active immediatly', async function () {
          const { receipt } = await this.manager.grantGroup(GROUPS.SOME, user, 0, { from: manager });
          const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
          expectEvent(receipt, 'GroupGranted', {
            groupId: GROUPS.SOME,
            account: user,
            since: timestamp.add(grantDelay),
            delay: '0',
          });

          expect(await this.manager.hasGroup(GROUPS.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);

          const access = await this.manager.getAccess(GROUPS.SOME, user);
          expect(access[0]).to.be.bignumber.equal(timestamp.add(grantDelay)); // inGroupSince
          expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
          expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
          expect(access[3]).to.be.bignumber.equal('0'); // effect
        });

        it('granted group is active after the delay', async function () {
          const { receipt } = await this.manager.grantGroup(GROUPS.SOME, user, 0, { from: manager });
          const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
          expectEvent(receipt, 'GroupGranted', {
            groupId: GROUPS.SOME,
            account: user,
            since: timestamp.add(grantDelay),
            delay: '0',
          });

          await time.increase(grantDelay);

          expect(await this.manager.hasGroup(GROUPS.SOME, user).then(formatAccess)).to.be.deep.equal([true, '0']);

          const access = await this.manager.getAccess(GROUPS.SOME, user);
          expect(access[0]).to.be.bignumber.equal(timestamp.add(grantDelay)); // inGroupSince
          expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
          expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
          expect(access[3]).to.be.bignumber.equal('0'); // effect
        });
      });
    });

    describe('revoke group', function () {
      it('from a user that is already in the group', async function () {
        expect(await this.manager.hasGroup(GROUPS.SOME, member).then(formatAccess)).to.be.deep.equal([true, '0']);

        const { receipt } = await this.manager.revokeGroup(GROUPS.SOME, member, { from: manager });
        expectEvent(receipt, 'GroupRevoked', { groupId: GROUPS.SOME, account: member });

        expect(await this.manager.hasGroup(GROUPS.SOME, member).then(formatAccess)).to.be.deep.equal([false, '0']);

        const access = await this.manager.getAccess(GROUPS.SOME, user);
        expect(access[0]).to.be.bignumber.equal('0'); // inGroupSince
        expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
        expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
        expect(access[3]).to.be.bignumber.equal('0'); // effect
      });

      it('from a user that is scheduled for joining the group', async function () {
        await this.manager.$_grantGroup(GROUPS.SOME, user, 10, 0); // grant delay 10

        expect(await this.manager.hasGroup(GROUPS.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);

        const { receipt } = await this.manager.revokeGroup(GROUPS.SOME, user, { from: manager });
        expectEvent(receipt, 'GroupRevoked', { groupId: GROUPS.SOME, account: user });

        expect(await this.manager.hasGroup(GROUPS.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);

        const access = await this.manager.getAccess(GROUPS.SOME, user);
        expect(access[0]).to.be.bignumber.equal('0'); // inGroupSince
        expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
        expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
        expect(access[3]).to.be.bignumber.equal('0'); // effect
      });

      it('from a user that is not in the group', async function () {
        expect(await this.manager.hasGroup(GROUPS.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);

        await expectRevertCustomError(
          this.manager.revokeGroup(GROUPS.SOME, user, { from: manager }),
          'AccessManagerAccountNotInGroup',
          [GROUPS.SOME, user],
        );
      });

      it('revoke group is restricted', async function () {
        await expectRevertCustomError(
          this.manager.revokeGroup(GROUPS.SOME, member, { from: other }),
          'AccessManagerUnauthorizedAccount',
          [other, GROUPS.SOME_ADMIN],
        );
      });
    });

    describe('renounce group', function () {
      it('for a user that is already in the group', async function () {
        expect(await this.manager.hasGroup(GROUPS.SOME, member).then(formatAccess)).to.be.deep.equal([true, '0']);

        const { receipt } = await this.manager.renounceGroup(GROUPS.SOME, member, { from: member });
        expectEvent(receipt, 'GroupRevoked', { groupId: GROUPS.SOME, account: member });

        expect(await this.manager.hasGroup(GROUPS.SOME, member).then(formatAccess)).to.be.deep.equal([false, '0']);

        const access = await this.manager.getAccess(GROUPS.SOME, member);
        expect(access[0]).to.be.bignumber.equal('0'); // inGroupSince
        expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
        expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
        expect(access[3]).to.be.bignumber.equal('0'); // effect
      });

      it('for a user that is schedule for joining the group', async function () {
        await this.manager.$_grantGroup(GROUPS.SOME, user, 10, 0); // grant delay 10

        expect(await this.manager.hasGroup(GROUPS.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);

        const { receipt } = await this.manager.renounceGroup(GROUPS.SOME, user, { from: user });
        expectEvent(receipt, 'GroupRevoked', { groupId: GROUPS.SOME, account: user });

        expect(await this.manager.hasGroup(GROUPS.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);

        const access = await this.manager.getAccess(GROUPS.SOME, user);
        expect(access[0]).to.be.bignumber.equal('0'); // inGroupSince
        expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
        expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
        expect(access[3]).to.be.bignumber.equal('0'); // effect
      });

      it('for a user that is not in the group', async function () {
        await expectRevertCustomError(
          this.manager.renounceGroup(GROUPS.SOME, user, { from: user }),
          'AccessManagerAccountNotInGroup',
          [GROUPS.SOME, user],
        );
      });

      it('bad user confirmation', async function () {
        await expectRevertCustomError(
          this.manager.renounceGroup(GROUPS.SOME, member, { from: user }),
          'AccessManagerBadConfirmation',
          [],
        );
      });
    });

    describe('change group admin', function () {
      it("admin can set any group's admin", async function () {
        expect(await this.manager.getGroupAdmin(GROUPS.SOME)).to.be.bignumber.equal(GROUPS.SOME_ADMIN);

        const { receipt } = await this.manager.setGroupAdmin(GROUPS.SOME, GROUPS.ADMIN, { from: admin });
        expectEvent(receipt, 'GroupAdminChanged', { groupId: GROUPS.SOME, admin: GROUPS.ADMIN });

        expect(await this.manager.getGroupAdmin(GROUPS.SOME)).to.be.bignumber.equal(GROUPS.ADMIN);
      });

      it("setting a group's admin is restricted", async function () {
        await expectRevertCustomError(
          this.manager.setGroupAdmin(GROUPS.SOME, GROUPS.SOME, { from: manager }),
          'AccessManagerUnauthorizedAccount',
          [manager, GROUPS.ADMIN],
        );
      });
    });

    describe('change group guardian', function () {
      it("admin can set any group's admin", async function () {
        expect(await this.manager.getGroupGuardian(GROUPS.SOME)).to.be.bignumber.equal(GROUPS.SOME_ADMIN);

        const { receipt } = await this.manager.setGroupGuardian(GROUPS.SOME, GROUPS.ADMIN, { from: admin });
        expectEvent(receipt, 'GroupGuardianChanged', { groupId: GROUPS.SOME, guardian: GROUPS.ADMIN });

        expect(await this.manager.getGroupGuardian(GROUPS.SOME)).to.be.bignumber.equal(GROUPS.ADMIN);
      });

      it("setting a group's admin is restricted", async function () {
        await expectRevertCustomError(
          this.manager.setGroupGuardian(GROUPS.SOME, GROUPS.SOME, { from: other }),
          'AccessManagerUnauthorizedAccount',
          [other, GROUPS.ADMIN],
        );
      });
    });

    describe('change execution delay', function () {
      it('increassing the delay has immediate effect', async function () {
        const oldDelay = web3.utils.toBN(10);
        const newDelay = web3.utils.toBN(100);

        await this.manager.$_setExecuteDelay(GROUPS.SOME, member, oldDelay);

        const accessBefore = await this.manager.getAccess(GROUPS.SOME, member);
        expect(accessBefore[1]).to.be.bignumber.equal(oldDelay); // currentDelay
        expect(accessBefore[2]).to.be.bignumber.equal('0'); // pendingDelay
        expect(accessBefore[3]).to.be.bignumber.equal('0'); // effect

        const { receipt } = await this.manager.setExecuteDelay(GROUPS.SOME, member, newDelay, {
          from: manager,
        });
        const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

        expectEvent(receipt, 'GroupExecutionDelayUpdated', {
          groupId: GROUPS.SOME,
          account: member,
          delay: newDelay,
          from: timestamp,
        });

        // immediate effect
        const accessAfter = await this.manager.getAccess(GROUPS.SOME, member);
        expect(accessAfter[1]).to.be.bignumber.equal(newDelay); // currentDelay
        expect(accessAfter[2]).to.be.bignumber.equal('0'); // pendingDelay
        expect(accessAfter[3]).to.be.bignumber.equal('0'); // effect
      });

      it('decreassing the delay takes time', async function () {
        const oldDelay = web3.utils.toBN(100);
        const newDelay = web3.utils.toBN(10);

        await this.manager.$_setExecuteDelay(GROUPS.SOME, member, oldDelay);

        const accessBefore = await this.manager.getAccess(GROUPS.SOME, member);
        expect(accessBefore[1]).to.be.bignumber.equal(oldDelay); // currentDelay
        expect(accessBefore[2]).to.be.bignumber.equal('0'); // pendingDelay
        expect(accessBefore[3]).to.be.bignumber.equal('0'); // effect

        const { receipt } = await this.manager.setExecuteDelay(GROUPS.SOME, member, newDelay, {
          from: manager,
        });
        const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

        expectEvent(receipt, 'GroupExecutionDelayUpdated', {
          groupId: GROUPS.SOME,
          account: member,
          delay: newDelay,
          from: timestamp.add(oldDelay).sub(newDelay),
        });

        // delayed effect
        const accessAfter = await this.manager.getAccess(GROUPS.SOME, member);
        expect(accessAfter[1]).to.be.bignumber.equal(oldDelay); // currentDelay
        expect(accessAfter[2]).to.be.bignumber.equal(newDelay); // pendingDelay
        expect(accessAfter[3]).to.be.bignumber.equal(timestamp.add(oldDelay).sub(newDelay)); // effect
      });

      it('cannot set the delay of a non member', async function () {
        await expectRevertCustomError(
          this.manager.setExecuteDelay(GROUPS.SOME, other, executeDelay, { from: manager }),
          'AccessManagerAccountNotInGroup',
          [GROUPS.SOME, other],
        );
      });

      it('cannot set the delay of public and admin groups', async function () {
        for (const group of [GROUPS.PUBLIC, GROUPS.ADMIN]) {
          await expectRevertCustomError(
            this.manager.$_setExecuteDelay(group, other, executeDelay, { from: manager }),
            'AccessManagerLockedGroup',
            [group],
          );
        }
      });

      it('can set a user execution delay during the grant delay', async function () {
        await this.manager.$_grantGroup(GROUPS.SOME, other, 10, 0);

        const { receipt } = await this.manager.setExecuteDelay(GROUPS.SOME, other, executeDelay, { from: manager });
        const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

        expectEvent(receipt, 'GroupExecutionDelayUpdated', {
          groupId: GROUPS.SOME,
          account: other,
          delay: executeDelay,
          from: timestamp,
        });
      });

      it('changing the execution delay is restricted', async function () {
        await expectRevertCustomError(
          this.manager.setExecuteDelay(GROUPS.SOME, member, executeDelay, { from: other }),
          'AccessManagerUnauthorizedAccount',
          [GROUPS.SOME_ADMIN, other],
        );
      });
    });

    describe('change grant delay', function () {
      it('increassing the delay has immediate effect', async function () {
        const oldDelay = web3.utils.toBN(10);
        const newDelay = web3.utils.toBN(100);
        await this.manager.$_setGrantDelay(GROUPS.SOME, oldDelay);

        expect(await this.manager.getGroupGrantDelay(GROUPS.SOME)).to.be.bignumber.equal(oldDelay);

        const { receipt } = await this.manager.setGrantDelay(GROUPS.SOME, newDelay, { from: admin });
        const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

        expectEvent(receipt, 'GroupGrantDelayChanged', { groupId: GROUPS.SOME, delay: newDelay, from: timestamp });

        expect(await this.manager.getGroupGrantDelay(GROUPS.SOME)).to.be.bignumber.equal(newDelay);
      });

      it('increassing the delay has delay effect', async function () {
        const oldDelay = web3.utils.toBN(100);
        const newDelay = web3.utils.toBN(10);
        await this.manager.$_setGrantDelay(GROUPS.SOME, oldDelay);

        expect(await this.manager.getGroupGrantDelay(GROUPS.SOME)).to.be.bignumber.equal(oldDelay);

        const { receipt } = await this.manager.setGrantDelay(GROUPS.SOME, newDelay, { from: admin });
        const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

        expectEvent(receipt, 'GroupGrantDelayChanged', {
          groupId: GROUPS.SOME,
          delay: newDelay,
          from: timestamp.add(oldDelay).sub(newDelay),
        });

        expect(await this.manager.getGroupGrantDelay(GROUPS.SOME)).to.be.bignumber.equal(oldDelay);

        await time.increase(oldDelay.sub(newDelay));

        expect(await this.manager.getGroupGrantDelay(GROUPS.SOME)).to.be.bignumber.equal(newDelay);
      });

      it('changing the grant delay is restricted', async function () {
        await expectRevertCustomError(
          this.manager.setGrantDelay(GROUPS.SOME, grantDelay, { from: other }),
          'AccessManagerUnauthorizedAccount',
          [GROUPS.ADMIN, other],
        );
      });
    });
  });

  describe('with AccessManaged target contract', function () {
    beforeEach('deploy target contract', async function () {
      this.target = await AccessManagedTarget.new(this.manager.address);
      // helpers for indirect calls
      this.callData = selector('fnRestricted()');
      this.call = [this.target.address, this.callData];
      this.opId = web3.utils.keccak256(
        web3.eth.abi.encodeParameters(['address', 'address', 'bytes'], [user, ...this.call]),
      );
      this.direct = (opts = {}) => this.target.fnRestricted({ from: user, ...opts });
      this.schedule = (opts = {}) => this.manager.schedule(...this.call, 0, { from: user, ...opts });
      this.relay = (opts = {}) => this.manager.relay(...this.call, { from: user, ...opts });
      this.cancel = (opts = {}) => this.manager.cancel(user, ...this.call, { from: user, ...opts });
    });

    describe('Change function permissions', function () {
      const sigs = ['someFunction()', 'someOtherFunction(uint256)', 'oneMoreFunction(address,uint8)'].map(selector);

      it('admin can set function group', async function () {
        for (const sig of sigs) {
          expect(await this.manager.getFamilyFunctionGroup(familyId, sig)).to.be.bignumber.equal(GROUPS.ADMIN);
        }

        const { receipt: receipt1 } = await this.manager.setFamilyFunctionGroup(familyId, sigs, GROUPS.SOME, {
          from: admin,
        });

        for (const sig of sigs) {
          expectEvent(receipt1, 'FamilyFunctionGroupUpdated', {
            familyId,
            selector: sig,
            groupId: GROUPS.SOME,
          });
          expect(await this.manager.getFamilyFunctionGroup(familyId, sig)).to.be.bignumber.equal(GROUPS.SOME);
        }

        const { receipt: receipt2 } = await this.manager.setFamilyFunctionGroup(
          familyId,
          [sigs[1]],
          GROUPS.SOME_ADMIN,
          { from: admin },
        );
        expectEvent(receipt2, 'FamilyFunctionGroupUpdated', {
          familyId,
          selector: sigs[1],
          groupId: GROUPS.SOME_ADMIN,
        });

        for (const sig of sigs) {
          expect(await this.manager.getFamilyFunctionGroup(familyId, sig)).to.be.bignumber.equal(
            sig == sigs[1] ? GROUPS.SOME_ADMIN : GROUPS.SOME,
          );
        }
      });

      it('non-admin cannot set function group', async function () {
        await expectRevertCustomError(
          this.manager.setFamilyFunctionGroup(familyId, sigs, GROUPS.SOME, { from: other }),
          'AccessManagerUnauthorizedAccount',
          [other, GROUPS.ADMIN],
        );
      });
    });

    // WIP
    describe('Calling restricted & unrestricted functions', function () {
      const product = (...arrays) => arrays.reduce((a, b) => a.flatMap(ai => b.map(bi => [...ai, bi])), [[]]);

      for (const [callerGroups, fnGroup, closed, delay] of product(
        [[], [GROUPS.SOME]],
        [undefined, GROUPS.ADMIN, GROUPS.SOME, GROUPS.PUBLIC],
        [false, true],
        [null, executeDelay],
      )) {
        // can we call with a delay ?
        const indirectSuccess = (fnGroup == GROUPS.PUBLIC || callerGroups.includes(fnGroup)) && !closed;

        // can we call without a delay ?
        const directSuccess = (fnGroup == GROUPS.PUBLIC || (callerGroups.includes(fnGroup) && !delay)) && !closed;

        const description = [
          'Caller in groups',
          '[' + (callerGroups ?? []).map(groupId => GROUPS[groupId]).join(', ') + ']',
          delay ? 'with a delay' : 'without a delay',
          '+',
          'functions open to groups',
          '[' + (GROUPS[fnGroup] ?? '') + ']',
          closed ? `(closed)` : '',
        ].join(' ');

        describe(description, function () {
          beforeEach(async function () {
            // setup
            await Promise.all([
              this.manager.$_setContractClosed(this.target.address, closed),
              this.manager.$_setContractFamily(this.target.address, familyId),
              fnGroup && this.manager.$_setFamilyFunctionGroup(familyId, selector('fnRestricted()'), fnGroup),
              fnGroup && this.manager.$_setFamilyFunctionGroup(familyId, selector('fnUnrestricted()'), fnGroup),
              ...callerGroups
                .filter(groupId => groupId != GROUPS.PUBLIC)
                .map(groupId => this.manager.$_grantGroup(groupId, user, 0, delay ?? 0)),
            ]);

            // post setup checks
            const result = await this.manager.getContractFamily(this.target.address);
            expect(result[0]).to.be.bignumber.equal(familyId);
            expect(result[1]).to.be.equal(closed);

            if (fnGroup) {
              expect(
                await this.manager.getFamilyFunctionGroup(familyId, selector('fnRestricted()')),
              ).to.be.bignumber.equal(fnGroup);
              expect(
                await this.manager.getFamilyFunctionGroup(familyId, selector('fnUnrestricted()')),
              ).to.be.bignumber.equal(fnGroup);
            }

            for (const groupId of callerGroups) {
              const access = await this.manager.getAccess(groupId, user);
              if (groupId == GROUPS.PUBLIC) {
                expect(access[0]).to.be.bignumber.equal('0'); // inGroupSince
                expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
                expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
                expect(access[3]).to.be.bignumber.equal('0'); // effect
              } else {
                expect(access[0]).to.be.bignumber.gt('0'); // inGroupSince
                expect(access[1]).to.be.bignumber.eq(String(delay ?? 0)); // currentDelay
                expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
                expect(access[3]).to.be.bignumber.equal('0'); // effect
              }
            }
          });

          it('canCall', async function () {
            const result = await this.manager.canCall(user, this.target.address, selector('fnRestricted()'));
            expect(result[0]).to.be.equal(directSuccess);
            expect(result[1]).to.be.bignumber.equal(!directSuccess && indirectSuccess ? delay ?? '0' : '0');
          });

          it('Calling a non restricted function never revert', async function () {
            expectEvent(await this.target.fnUnrestricted({ from: user }), 'CalledUnrestricted', {
              caller: user,
            });
          });

          it(`Calling a restricted function directly should ${
            directSuccess ? 'succeed' : 'revert'
          }`, async function () {
            const promise = this.direct();

            if (directSuccess) {
              expectEvent(await promise, 'CalledRestricted', { caller: user });
            } else if (indirectSuccess) {
              await expectRevertCustomError(promise, 'AccessManagerNotScheduled', [this.opId]);
            } else {
              await expectRevertCustomError(promise, 'AccessManagedUnauthorized', [user]);
            }
          });

          it('Calling indirectly: only relay', async function () {
            // relay without schedule
            if (directSuccess) {
              const { receipt, tx } = await this.relay();
              expectEvent.notEmitted(receipt, 'OperationExecuted', { operationId: this.opId });
              await expectEvent.inTransaction(tx, this.target, 'CalledRestricted', { caller: this.manager.address });
            } else if (indirectSuccess) {
              await expectRevertCustomError(this.relay(), 'AccessManagerNotScheduled', [this.opId]);
            } else {
              await expectRevertCustomError(this.relay(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
            }
          });

          it('Calling indirectly: schedule and relay', async function () {
            if (directSuccess || indirectSuccess) {
              const { receipt } = await this.schedule();
              const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

              expectEvent(receipt, 'OperationScheduled', {
                operationId: this.opId,
                caller: user,
                target: this.call[0],
                data: this.call[1],
              });

              // if can call directly, delay should be 0. Otherwise, the delay should be applied
              expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(
                timestamp.add(directSuccess ? web3.utils.toBN(0) : delay),
              );

              // execute without wait
              if (directSuccess) {
                const { receipt, tx } = await this.relay();
                await expectEvent.inTransaction(tx, this.target, 'CalledRestricted', { caller: this.manager.address });
                if (delay && fnGroup !== GROUPS.PUBLIC) {
                  expectEvent(receipt, 'OperationExecuted', { operationId: this.opId });
                  expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal('0');
                }
              } else if (indirectSuccess) {
                await expectRevertCustomError(this.relay(), 'AccessManagerNotReady', [this.opId]);
              } else {
                await expectRevertCustomError(this.relay(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
              }
            } else {
              await expectRevertCustomError(this.schedule(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
            }
          });

          it('Calling indirectly: schedule wait and relay', async function () {
            if (directSuccess || indirectSuccess) {
              const { receipt } = await this.schedule();
              const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

              expectEvent(receipt, 'OperationScheduled', {
                operationId: this.opId,
                caller: user,
                target: this.call[0],
                data: this.call[1],
              });

              // if can call directly, delay should be 0. Otherwise, the delay should be applied
              expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(
                timestamp.add(directSuccess ? web3.utils.toBN(0) : delay),
              );

              // wait
              await time.increase(delay ?? 0);

              // execute without wait
              if (directSuccess || indirectSuccess) {
                const { receipt, tx } = await this.relay();
                await expectEvent.inTransaction(tx, this.target, 'CalledRestricted', { caller: this.manager.address });
                if (delay && fnGroup !== GROUPS.PUBLIC) {
                  expectEvent(receipt, 'OperationExecuted', { operationId: this.opId });
                  expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal('0');
                }
              } else {
                await expectRevertCustomError(this.relay(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
              }
            } else {
              await expectRevertCustomError(this.schedule(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
            }
          });

          it('Calling directly: schedule and call', async function () {
            if (directSuccess || indirectSuccess) {
              const { receipt } = await this.schedule();
              const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

              expectEvent(receipt, 'OperationScheduled', {
                operationId: this.opId,
                caller: user,
                target: this.call[0],
                data: this.call[1],
              });

              // if can call directly, delay should be 0. Otherwise, the delay should be applied
              const schedule = timestamp.add(directSuccess ? web3.utils.toBN(0) : delay);
              expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(schedule);

              // execute without wait
              const promise = this.direct();
              if (directSuccess) {
                expectEvent(await promise, 'CalledRestricted', { caller: user });

                // schedule is not reset
                expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(schedule);
              } else if (indirectSuccess) {
                await expectRevertCustomError(promise, 'AccessManagerNotReady', [this.opId]);
              } else {
                await expectRevertCustomError(promise, 'AccessManagerUnauthorizedCall', [user, ...this.call]);
              }
            } else {
              await expectRevertCustomError(this.schedule(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
            }
          });

          it('Calling directly: schedule wait and call', async function () {
            if (directSuccess || indirectSuccess) {
              const { receipt } = await this.schedule();
              const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

              expectEvent(receipt, 'OperationScheduled', {
                operationId: this.opId,
                caller: user,
                target: this.call[0],
                data: this.call[1],
              });

              // if can call directly, delay should be 0. Otherwise, the delay should be applied
              const schedule = timestamp.add(directSuccess ? web3.utils.toBN(0) : delay);
              expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(schedule);

              // wait
              await time.increase(delay ?? 0);

              // execute without wait
              const promise = await this.direct();
              if (directSuccess) {
                expectEvent(await promise, 'CalledRestricted', { caller: user });

                // schedule is not reset
                expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(schedule);
              } else if (indirectSuccess) {
                const receipt = await promise;

                expectEvent(receipt, 'CalledRestricted', { caller: user });
                await expectEvent.inTransaction(receipt.tx, this.manager, 'OperationExecuted', {
                  operationId: this.opId,
                });

                // schedule is reset
                expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal('0');
              } else {
                await expectRevertCustomError(this.direct(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
              }
            } else {
              await expectRevertCustomError(this.schedule(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
            }
          });

          it('Scheduling for later than needed'); // TODO
        });
      }
    });

    describe('Indirect execution corner-cases', async function () {
      beforeEach(async function () {
        await this.manager.$_setContractFamily(this.target.address, familyId);
        await this.manager.$_setFamilyFunctionGroup(familyId, this.callData, GROUPS.SOME);
        await this.manager.$_grantGroup(GROUPS.SOME, user, 0, executeDelay);
      });

      it('Checking canCall when caller is the manager depend on the _relayIdentifier', async function () {
        const result = await this.manager.canCall(this.manager.address, this.target.address, '0x00000000');
        expect(result[0]).to.be.false;
        expect(result[1]).to.be.bignumber.equal('0');
      });

      it('Cannot execute earlier', async function () {
        const { receipt } = await this.schedule();
        const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

        expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(timestamp.add(executeDelay));

        // we need to set the clock 2 seconds before the value, because the increaseTo "consumes" the timestamp
        // and the next transaction will be one after that (see check below)
        await time.increaseTo(timestamp.add(executeDelay).subn(2));

        // too early
        await expectRevertCustomError(this.relay(), 'AccessManagerNotReady', [this.opId]);

        // the revert happened one second before the execution delay expired
        expect(await time.latest()).to.be.bignumber.equal(timestamp.add(executeDelay).subn(1));

        // ok
        await this.relay();

        // the success happened when the delay was reached (earliest possible)
        expect(await time.latest()).to.be.bignumber.equal(timestamp.add(executeDelay));
      });

      it('Cannot schedule an already scheduled operation', async function () {
        const { receipt } = await this.schedule();
        expectEvent(receipt, 'OperationScheduled', {
          operationId: this.opId,
          caller: user,
          target: this.call[0],
          data: this.call[1],
        });

        await expectRevertCustomError(this.schedule(), 'AccessManagerAlreadyScheduled', [this.opId]);
      });

      it('Cannot cancel an operation that is not scheduled', async function () {
        await expectRevertCustomError(this.cancel(), 'AccessManagerNotScheduled', [this.opId]);
      });

      it('Cannot cancel an operation that is not already relayed', async function () {
        await this.schedule();
        await time.increase(executeDelay);
        await this.relay();

        await expectRevertCustomError(this.cancel(), 'AccessManagerNotScheduled', [this.opId]);
      });

      it('Scheduler can cancel', async function () {
        await this.schedule();

        expect(await this.manager.getSchedule(this.opId)).to.not.be.bignumber.equal('0');

        expectEvent(await this.cancel({ from: manager }), 'OperationCanceled', { operationId: this.opId });

        expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal('0');
      });

      it('Guardian can cancel', async function () {
        await this.schedule();

        expect(await this.manager.getSchedule(this.opId)).to.not.be.bignumber.equal('0');

        expectEvent(await this.cancel({ from: manager }), 'OperationCanceled', { operationId: this.opId });

        expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal('0');
      });

      it('Cancel is restricted', async function () {
        await this.schedule();

        expect(await this.manager.getSchedule(this.opId)).to.not.be.bignumber.equal('0');

        await expectRevertCustomError(this.cancel({ from: other }), 'AccessManagerCannotCancel', [
          other,
          user,
          ...this.call,
        ]);

        expect(await this.manager.getSchedule(this.opId)).to.not.be.bignumber.equal('0');
      });

      it('Can re-schedule after execution', async function () {
        await this.schedule();
        await time.increase(executeDelay);
        await this.relay();

        // reschedule
        const { receipt } = await this.schedule();
        expectEvent(receipt, 'OperationScheduled', {
          operationId: this.opId,
          caller: user,
          target: this.call[0],
          data: this.call[1],
        });
      });

      it('Can re-schedule after cancel', async function () {
        await this.schedule();
        await this.cancel();

        // reschedule
        const { receipt } = await this.schedule();
        expectEvent(receipt, 'OperationScheduled', {
          operationId: this.opId,
          caller: user,
          target: this.call[0],
          data: this.call[1],
        });
      });
    });
  });

  describe('with Ownable target contract', function () {
    const groupId = web3.utils.toBN(1);

    beforeEach(async function () {
      this.ownable = await Ownable.new(this.manager.address);

      // add user to group
      await this.manager.$_grantGroup(groupId, user, 0, 0);
    });

    it('initial state', async function () {
      expect(await this.ownable.owner()).to.be.equal(this.manager.address);
    });

    describe('Contract is closed', function () {
      beforeEach(async function () {
        await this.manager.$_setContractClosed(this.ownable.address, true);
      });

      it('directly call: reverts', async function () {
        await expectRevertCustomError(this.ownable.$_checkOwner({ from: user }), 'OwnableUnauthorizedAccount', [user]);
      });

      it('relayed call (with group): reverts', async function () {
        await expectRevertCustomError(
          this.manager.relay(this.ownable.address, selector('$_checkOwner()'), { from: user }),
          'AccessManagerUnauthorizedCall',
          [user, this.ownable.address, selector('$_checkOwner()')],
        );
      });

      it('relayed call (without group): reverts', async function () {
        await expectRevertCustomError(
          this.manager.relay(this.ownable.address, selector('$_checkOwner()'), { from: other }),
          'AccessManagerUnauthorizedCall',
          [other, this.ownable.address, selector('$_checkOwner()')],
        );
      });
    });

    describe('Contract is managed', function () {
      beforeEach('add contract to family', async function () {
        await this.manager.$_setContractFamily(this.ownable.address, familyId);
      });

      describe('function is open to specific group', function () {
        beforeEach(async function () {
          await this.manager.$_setFamilyFunctionGroup(familyId, selector('$_checkOwner()'), groupId);
        });

        it('directly call: reverts', async function () {
          await expectRevertCustomError(this.ownable.$_checkOwner({ from: user }), 'OwnableUnauthorizedAccount', [
            user,
          ]);
        });

        it('relayed call (with group): success', async function () {
          await this.manager.relay(this.ownable.address, selector('$_checkOwner()'), { from: user });
        });

        it('relayed call (without group): reverts', async function () {
          await expectRevertCustomError(
            this.manager.relay(this.ownable.address, selector('$_checkOwner()'), { from: other }),
            'AccessManagerUnauthorizedCall',
            [other, this.ownable.address, selector('$_checkOwner()')],
          );
        });
      });

      describe('function is open to public group', function () {
        beforeEach(async function () {
          await this.manager.$_setFamilyFunctionGroup(familyId, selector('$_checkOwner()'), GROUPS.PUBLIC);
        });

        it('directly call: reverts', async function () {
          await expectRevertCustomError(this.ownable.$_checkOwner({ from: user }), 'OwnableUnauthorizedAccount', [
            user,
          ]);
        });

        it('relayed call (with group): success', async function () {
          await this.manager.relay(this.ownable.address, selector('$_checkOwner()'), { from: user });
        });

        it('relayed call (without group): success', async function () {
          await this.manager.relay(this.ownable.address, selector('$_checkOwner()'), { from: other });
        });
      });
    });
  });

  describe('authority update', function () {
    beforeEach(async function () {
      this.newManager = await AccessManager.new(admin);
      this.target = await AccessManagedTarget.new(this.manager.address);
    });

    it('admin can change authority', async function () {
      expect(await this.target.authority()).to.be.equal(this.manager.address);

      const { tx } = await this.manager.updateAuthority(this.target.address, this.newManager.address, { from: admin });
      await expectEvent.inTransaction(tx, this.target, 'AuthorityUpdated', { authority: this.newManager.address });

      expect(await this.target.authority()).to.be.equal(this.newManager.address);
    });

    it('cannot set an address without code as the authority', async function () {
      await expectRevertCustomError(
        this.manager.updateAuthority(this.target.address, user, { from: admin }),
        'AccessManagedInvalidAuthority',
        [user],
      );
    });

    it('updateAuthority is restricted on manager', async function () {
      await expectRevertCustomError(
        this.manager.updateAuthority(this.target.address, this.newManager.address, { from: other }),
        'AccessManagerUnauthorizedAccount',
        [other, GROUPS.ADMIN],
      );
    });

    it('setAuthority is restricted on AccessManaged', async function () {
      await expectRevertCustomError(
        this.target.setAuthority(this.newManager.address, { from: admin }),
        'AccessManagedUnauthorized',
        [admin],
      );
    });
  });

  // TODO: test all admin functions
  describe('family delays', function () {
    const otherFamilyId = '2';
    const delay = '1000';

    beforeEach('set contract family', async function () {
      this.target = await AccessManagedTarget.new(this.manager.address);
      await this.manager.setContractFamily(this.target.address, familyId, { from: admin });

      this.call = () => this.manager.setContractFamily(this.target.address, otherFamilyId, { from: admin });
      this.data = this.manager.contract.methods.setContractFamily(this.target.address, otherFamilyId).encodeABI();
    });

    it('without delay: succeeds', async function () {
      await this.call();
    });

    // TODO: here we need to check increase and decrease.
    // - Increasing should have immediate effect
    // - Decreassing should take time.
    describe('with delay', function () {
      beforeEach('set admin delay', async function () {
        this.tx = await this.manager.setFamilyAdminDelay(familyId, delay, { from: admin });
        this.opId = web3.utils.keccak256(
          web3.eth.abi.encodeParameters(['address', 'address', 'bytes'], [admin, this.manager.address, this.data]),
        );
      });

      it('emits event and sets delay', async function () {
        const from = await clockFromReceipt.timestamp(this.tx.receipt).then(web3.utils.toBN);
        expectEvent(this.tx.receipt, 'FamilyAdminDelayUpdated', { familyId, delay, from });

        expect(await this.manager.getFamilyAdminDelay(familyId)).to.be.bignumber.equal(delay);
      });

      it('without prior scheduling: reverts', async function () {
        await expectRevertCustomError(this.call(), 'AccessManagerNotScheduled', [this.opId]);
      });

      describe('with prior scheduling', async function () {
        beforeEach('schedule', async function () {
          await this.manager.schedule(this.manager.address, this.data, 0, { from: admin });
        });

        it('without delay: reverts', async function () {
          await expectRevertCustomError(this.call(), 'AccessManagerNotReady', [this.opId]);
        });

        it('with delay: succeeds', async function () {
          await time.increase(delay);
          await this.call();
        });
      });
    });
  });
});
