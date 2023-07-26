const { expectEvent, expectRevert, constants, time } = require('@openzeppelin/test-helpers');
const { expectRevertCustomError } = require('../../helpers/customError');
const { Enum } = require('../../helpers/enums');
const { selector } = require('../../helpers/methods');
const { clockFromReceipt } = require('../../helpers/time');

const AccessManager = artifacts.require('$AccessManager');
const AccessManagedTarget = artifacts.require('$AccessManagedTarget');

const AccessMode = Enum('Custom', 'Closed', 'Open');

const GROUPS = {
  ADMIN:      web3.utils.toBN(0),
  SOME_ADMIN: web3.utils.toBN(17),
  SOME:       web3.utils.toBN(42),
  PUBLIC:     constants.MAX_UINT256,
};
Object.assign(GROUPS, Object.fromEntries(Object.entries(GROUPS).map(([ key, value ]) => [ value, key ])));

const executeDelay = web3.utils.toBN(10);
const grantDelay = web3.utils.toBN(10);

contract('AccessManager', function (accounts) {
  const [admin, manager, member, other] = accounts;

  beforeEach(async function () {
    this.manager = await AccessManager.new(admin);
    this.target = await AccessManagedTarget.new(this.manager.address);

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
    expect(await this.manager.hasGroup(GROUPS.ADMIN, admin)).to.be.equal(true);
    expect(await this.manager.hasGroup(GROUPS.ADMIN, manager)).to.be.equal(false);
    expect(await this.manager.hasGroup(GROUPS.ADMIN, member)).to.be.equal(false);
    expect(await this.manager.hasGroup(GROUPS.ADMIN, other)).to.be.equal(false);
    expect(await this.manager.hasGroup(GROUPS.SOME_ADMIN, admin)).to.be.equal(false);
    expect(await this.manager.hasGroup(GROUPS.SOME_ADMIN, manager)).to.be.equal(true);
    expect(await this.manager.hasGroup(GROUPS.SOME_ADMIN, member)).to.be.equal(false);
    expect(await this.manager.hasGroup(GROUPS.SOME_ADMIN, other)).to.be.equal(false);
    expect(await this.manager.hasGroup(GROUPS.SOME, admin)).to.be.equal(false);
    expect(await this.manager.hasGroup(GROUPS.SOME, manager)).to.be.equal(false);
    expect(await this.manager.hasGroup(GROUPS.SOME, member)).to.be.equal(true);
    expect(await this.manager.hasGroup(GROUPS.SOME, other)).to.be.equal(false);
    expect(await this.manager.hasGroup(GROUPS.PUBLIC, admin)).to.be.equal(true);
    expect(await this.manager.hasGroup(GROUPS.PUBLIC, manager)).to.be.equal(true);
    expect(await this.manager.hasGroup(GROUPS.PUBLIC, member)).to.be.equal(true);
    expect(await this.manager.hasGroup(GROUPS.PUBLIC, other)).to.be.equal(true);
  });

  describe('groups management', function () {
    describe('grand group', function () {
      describe('without a grant delay', function () {
        it('without an execute delay', async function () {
          expect(await this.manager.hasGroup(GROUPS.SOME, other)).to.be.false;

          const { receipt } = await this.manager.grantGroup(GROUPS.SOME, other, 0, { from: manager });
          const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
          expectEvent(receipt, 'GroupGranted', { groupId: GROUPS.SOME, account: other, since: timestamp, delay: '0' });

          expect(await this.manager.hasGroup(GROUPS.SOME, other)).to.be.true;

          const { delay, since } = await this.manager.getAccess(GROUPS.SOME, other);
          expect(delay).to.be.bignumber.equal('0');
          expect(since).to.be.bignumber.equal(timestamp);
        });

        it('with an execute delay', async function () {
          expect(await this.manager.hasGroup(GROUPS.SOME, other)).to.be.false;

          const { receipt } = await this.manager.grantGroup(GROUPS.SOME, other, executeDelay, { from: manager });
          const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
          expectEvent(receipt, 'GroupGranted', { groupId: GROUPS.SOME, account: other, since: timestamp, delay: executeDelay });

          expect(await this.manager.hasGroup(GROUPS.SOME, other)).to.be.true;

          const { delay, since } = await this.manager.getAccess(GROUPS.SOME, other);
          expect(delay).to.be.bignumber.equal(executeDelay);
          expect(since).to.be.bignumber.equal(timestamp);
        });

        it('to a user that is already in the group', async function () {
          expect(await this.manager.hasGroup(GROUPS.SOME, member)).to.be.true;

          await expectRevertCustomError(
            this.manager.grantGroup(GROUPS.SOME, member, 0, { from: manager }),
            'AccessManagerAcountAlreadyInGroup',
            [GROUPS.SOME, member],
          );
        });

        it('to a user that is scheduled for joining the group', async function () {
          await this.manager.$_grantGroup(GROUPS.SOME, other, 10, 0); // grant delay 10

          expect(await this.manager.hasGroup(GROUPS.SOME, other)).to.be.false;

          await expectRevertCustomError(
            this.manager.grantGroup(GROUPS.SOME, other, 0, { from: manager }),
            'AccessManagerAcountAlreadyInGroup',
            [GROUPS.SOME, other],
          );
        });

        it('grant group is restricted', async function () {
          await expectRevertCustomError(
            this.manager.grantGroup(GROUPS.SOME, other, 0, { from: other }),
            'AccessControlUnauthorizedAccount',
            [other, GROUPS.SOME_ADMIN],
          );
        });
      });

      describe('with a grant delay', function () {
        beforeEach(async function () {
          await this.manager.$_setGrantDelay(GROUPS.SOME, grantDelay, true);
        });

        it('granted group is not active immediatly', async function () {
          const { receipt } = await this.manager.grantGroup(GROUPS.SOME, other, 0, { from: manager });
          const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
          expectEvent(receipt, 'GroupGranted', { groupId: GROUPS.SOME, account: other, since: timestamp.add(grantDelay), delay: '0' });

          expect(await this.manager.hasGroup(GROUPS.SOME, other)).to.be.false;

          const { delay, since } = await this.manager.getAccess(GROUPS.SOME, other);
          expect(delay).to.be.bignumber.equal('0');
          expect(since).to.be.bignumber.equal(timestamp.add(grantDelay));
        });

        it('granted group is active after the delay', async function () {
          const { receipt } = await this.manager.grantGroup(GROUPS.SOME, other, 0, { from: manager });
          const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
          expectEvent(receipt, 'GroupGranted', { groupId: GROUPS.SOME, account: other, since: timestamp.add(grantDelay), delay: '0' });

          await time.increase(grantDelay);

          expect(await this.manager.hasGroup(GROUPS.SOME, other)).to.be.true;

          const { delay, since } = await this.manager.getAccess(GROUPS.SOME, other);
          expect(delay).to.be.bignumber.equal('0');
          expect(since).to.be.bignumber.equal(timestamp.add(grantDelay));
        });
      });
    });

    describe('revoke group', function () {
      it('from a user that is already in the group', async function () {
        expect(await this.manager.hasGroup(GROUPS.SOME, member)).to.be.true;

        const { receipt } = await this.manager.revokeGroup(GROUPS.SOME, member, { from: manager });
        expectEvent(receipt, 'GroupRevoked', { groupId: GROUPS.SOME, account: member });

        expect(await this.manager.hasGroup(GROUPS.SOME, member)).to.be.false;

        const { delay, since } = await this.manager.getAccess(GROUPS.SOME, other);
        expect(delay).to.be.bignumber.equal('0');
        expect(since).to.be.bignumber.equal('0');
      });

      it('from a user that is scheduled for joining the group', async function () {
        await this.manager.$_grantGroup(GROUPS.SOME, other, 10, 0); // grant delay 10

        expect(await this.manager.hasGroup(GROUPS.SOME, other)).to.be.false;

        const { receipt } = await this.manager.revokeGroup(GROUPS.SOME, other, { from: manager });
        expectEvent(receipt, 'GroupRevoked', { groupId: GROUPS.SOME, account: other });

        expect(await this.manager.hasGroup(GROUPS.SOME, other)).to.be.false;

        const { delay, since } = await this.manager.getAccess(GROUPS.SOME, other);
        expect(delay).to.be.bignumber.equal('0');
        expect(since).to.be.bignumber.equal('0');
      });

      it('from a user that is not in the group', async function () {
        expect(await this.manager.hasGroup(GROUPS.SOME, other)).to.be.false;

        await expectRevertCustomError(
          this.manager.revokeGroup(GROUPS.SOME, other, { from: manager }),
          'AccessManagerAcountNotInGroup',
          [GROUPS.SOME, other],
        );
      });

      it('revoke group is restricted', async function () {
        await expectRevertCustomError(
          this.manager.revokeGroup(GROUPS.SOME, member, { from: other }),
          'AccessControlUnauthorizedAccount',
          [other, GROUPS.SOME_ADMIN],
        );
      });
    });

    describe('renounce group', function () {
      it('for a user that is already in the group', async function () {
        expect(await this.manager.hasGroup(GROUPS.SOME, member)).to.be.true;

        const { receipt } = await this.manager.renounceGroup(GROUPS.SOME, member, { from: member });
        expectEvent(receipt, 'GroupRevoked', { groupId: GROUPS.SOME, account: member });

        expect(await this.manager.hasGroup(GROUPS.SOME, member)).to.be.false;

        const { delay, since } = await this.manager.getAccess(GROUPS.SOME, member);
        expect(delay).to.be.bignumber.equal('0');
        expect(since).to.be.bignumber.equal('0');
      });

      it('for a user that is schedule for joining the group', async function () {
        await this.manager.$_grantGroup(GROUPS.SOME, other, 10, 0); // grant delay 10

        expect(await this.manager.hasGroup(GROUPS.SOME, other)).to.be.false;

        const { receipt } = await this.manager.renounceGroup(GROUPS.SOME, other, { from: other });
        expectEvent(receipt, 'GroupRevoked', { groupId: GROUPS.SOME, account: other });

        expect(await this.manager.hasGroup(GROUPS.SOME, other)).to.be.false;

        const { delay, since } = await this.manager.getAccess(GROUPS.SOME, other);
        expect(delay).to.be.bignumber.equal('0');
        expect(since).to.be.bignumber.equal('0');
      });

      it('for a user that is not in the group', async function () {
        await expectRevertCustomError(
          this.manager.renounceGroup(GROUPS.SOME, other, { from: other }),
          'AccessManagerAcountNotInGroup',
          [GROUPS.SOME, other],
        );
      });

      it('bad user confirmation', async function () {
        await expectRevertCustomError(
          this.manager.renounceGroup(GROUPS.SOME, member, { from: other }),
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

      it("seeting a group's admin is restricted", async function () {
        await expectRevertCustomError(
          this.manager.setGroupAdmin(GROUPS.SOME, GROUPS.SOME, { from: manager }),
          'AccessControlUnauthorizedAccount',
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

      it("seeting a group's admin is restricted", async function () {
        await expectRevertCustomError(
          this.manager.setGroupGuardian(GROUPS.SOME, GROUPS.SOME, { from: manager }),
          'AccessControlUnauthorizedAccount',
          [manager, GROUPS.ADMIN],
        );
      });
    });

    describe.skip('change execution delay', function () {});
    describe.skip('change grant delay', function () {});
  });





  describe('canCall scenario', function () {
    for (const callerOpt of [
      { groups: [] },
      { groups: [GROUPS.SOME] },
      { groups: [GROUPS.SOME], delay: executeDelay },
      { groups: [GROUPS.SOME, GROUPS.PUBLIC], delay: executeDelay },
    ])
    for (const targetOpt of [
      { mode: AccessMode.Open },
      { mode: AccessMode.Closed },
      { mode: AccessMode.Custom, group: GROUPS.ADMIN },
      { mode: AccessMode.Custom, group: GROUPS.SOME },
      { mode: AccessMode.Custom, group: GROUPS.PUBLIC },
    ]) {

      // can we call with a delay ?
      const indirectSuccess =
        (targetOpt.mode == AccessMode.Open) ||
        (targetOpt.mode == AccessMode.Custom && callerOpt.groups?.includes(targetOpt.group)) ||
        (targetOpt.mode == AccessMode.Custom && targetOpt.group == GROUPS.PUBLIC);

      // can we call without a delay ?
      const directSuccess =
        (targetOpt.mode == AccessMode.Open) || // contract is open
        (targetOpt.mode == AccessMode.Custom && callerOpt.groups?.includes(targetOpt.group) && !callerOpt.delay) || // user has group, without a delay
        (targetOpt.mode == AccessMode.Custom && targetOpt.group == GROUPS.PUBLIC && !(callerOpt.delay && callerOpt.groups?.includes(GROUPS.PUBLIC))); // function is public, and user doesn't have a delay on the public group

      const descr = [
        'Caller in groups [',
        (callerOpt.groups ?? []).map(groupId => GROUPS[groupId]).join(', '),
        ']',
        callerOpt.delay ? 'with a delay' : 'without a delay',
        '+',
        'contract in mode',
        Object.keys(AccessMode)[targetOpt.mode.toNumber()],
        targetOpt.mode == AccessMode.Custom ? `(${GROUPS[targetOpt.group]})` : '',
      ].join(' ');

      describe(descr, function () {
        beforeEach(async function () {
          // setup
          await Promise.all([
            this.manager.$_setContractMode(this.target.address, targetOpt.mode),
            targetOpt.group && this.manager.$_setFunctionAllowedGroup(this.target.address, selector('fnRestricted()'), targetOpt.group),
            targetOpt.group && this.manager.$_setFunctionAllowedGroup(this.target.address, selector('fnUnrestricted()'), targetOpt.group),
            ...(callerOpt.groups ?? []).map(groupId => this.manager.$_grantGroup(groupId, other, 0, callerOpt.delay ?? 0))
          ]);

          // post setup checks
          expect(await this.manager.getContractMode(this.target.address)).to.be.bignumber.equal(targetOpt.mode)
          targetOpt.group && expect(await this.manager.getFunctionAllowedGroup(this.target.address, selector('fnRestricted()'))).to.be.bignumber.equal(targetOpt.group)
          targetOpt.group && expect(await this.manager.getFunctionAllowedGroup(this.target.address, selector('fnUnrestricted()'))).to.be.bignumber.equal(targetOpt.group)
          for (const groupId of callerOpt.groups ?? []) {
            const access = await this.manager.getAccess(groupId, other);
            expect(access.since).to.be.bignumber.gt('0');
            expect(access.delay).to.be.bignumber.eq(String(callerOpt.delay ?? 0));
          }
        });

        it('Calling a non restricted function never revert', async function () {
          await expectEvent(
            await this.target.fnUnrestricted({ from: other }),
            'CalledUnrestricted',
            { caller: other }
          );
        });

        it(`Calling a restricted function directly should ${directSuccess ? 'succeed' : 'revert'}`, async function () {
          const promise = this.target.fnRestricted({ from: other });

          if (directSuccess) {
            await expectEvent(
              await promise,
              'CalledRestricted',
              { caller: other }
            );
          } else {
            await expectRevertCustomError(
              promise,
              'AccessManagedUnauthorized',
              [other]
            );
          }
        });

        it.skip(`Calling a restricted function indirectly should ${indirectSuccess ? 'succeed' : 'revert'}`, async function () {});
      });
    }
  });
});
