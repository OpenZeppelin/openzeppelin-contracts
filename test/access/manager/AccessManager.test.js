const { web3 } = require('hardhat');
const { constants, expectEvent, time } = require('@openzeppelin/test-helpers');
const { expectRevertCustomError } = require('../../helpers/customError');
const { selector } = require('../../helpers/methods');
const { clockFromReceipt } = require('../../helpers/time');
const { product } = require('../../helpers/iterate');
const helpers = require('@nomicfoundation/hardhat-network-helpers');

const AccessManager = artifacts.require('$AccessManager');
const AccessManagedTarget = artifacts.require('$AccessManagedTarget');
const Ownable = artifacts.require('$Ownable');

const MAX_UINT64 = web3.utils.toBN((2n ** 64n - 1n).toString());

const ROLES = {
  ADMIN: web3.utils.toBN(0),
  SOME_ADMIN: web3.utils.toBN(17),
  SOME: web3.utils.toBN(42),
  PUBLIC: MAX_UINT64,
};
Object.assign(ROLES, Object.fromEntries(Object.entries(ROLES).map(([key, value]) => [value, key])));

const executeDelay = web3.utils.toBN(10);
const grantDelay = web3.utils.toBN(10);
const MINSETBACK = time.duration.days(5);

const formatAccess = access => [access[0], access[1].toString()];

contract('AccessManager', function (accounts) {
  const [admin, manager, member, user, other] = accounts;

  beforeEach(async function () {
    this.manager = await AccessManager.new(admin);

    // add member to role
    await this.manager.$_setRoleAdmin(ROLES.SOME, ROLES.SOME_ADMIN);
    await this.manager.$_setRoleGuardian(ROLES.SOME, ROLES.SOME_ADMIN);
    await this.manager.$_grantRole(ROLES.SOME_ADMIN, manager, 0, 0);
    await this.manager.$_grantRole(ROLES.SOME, member, 0, 0);
  });

  it('rejects zero address for initialAdmin', async function () {
    await expectRevertCustomError(AccessManager.new(constants.ZERO_ADDRESS), 'AccessManagerInvalidInitialAdmin', [
      constants.ZERO_ADDRESS,
    ]);
  });

  it('default minsetback is 1 day', async function () {
    expect(await this.manager.minSetback()).to.be.bignumber.equal(MINSETBACK);
  });

  it('roles are correctly initialized', async function () {
    // role admin
    expect(await this.manager.getRoleAdmin(ROLES.ADMIN)).to.be.bignumber.equal(ROLES.ADMIN);
    expect(await this.manager.getRoleAdmin(ROLES.SOME_ADMIN)).to.be.bignumber.equal(ROLES.ADMIN);
    expect(await this.manager.getRoleAdmin(ROLES.SOME)).to.be.bignumber.equal(ROLES.SOME_ADMIN);
    expect(await this.manager.getRoleAdmin(ROLES.PUBLIC)).to.be.bignumber.equal(ROLES.ADMIN);
    // role guardian
    expect(await this.manager.getRoleGuardian(ROLES.ADMIN)).to.be.bignumber.equal(ROLES.ADMIN);
    expect(await this.manager.getRoleGuardian(ROLES.SOME_ADMIN)).to.be.bignumber.equal(ROLES.ADMIN);
    expect(await this.manager.getRoleGuardian(ROLES.SOME)).to.be.bignumber.equal(ROLES.SOME_ADMIN);
    expect(await this.manager.getRoleGuardian(ROLES.PUBLIC)).to.be.bignumber.equal(ROLES.ADMIN);
    // role members
    expect(await this.manager.hasRole(ROLES.ADMIN, admin).then(formatAccess)).to.be.deep.equal([true, '0']);
    expect(await this.manager.hasRole(ROLES.ADMIN, manager).then(formatAccess)).to.be.deep.equal([false, '0']);
    expect(await this.manager.hasRole(ROLES.ADMIN, member).then(formatAccess)).to.be.deep.equal([false, '0']);
    expect(await this.manager.hasRole(ROLES.ADMIN, user).then(formatAccess)).to.be.deep.equal([false, '0']);
    expect(await this.manager.hasRole(ROLES.SOME_ADMIN, admin).then(formatAccess)).to.be.deep.equal([false, '0']);
    expect(await this.manager.hasRole(ROLES.SOME_ADMIN, manager).then(formatAccess)).to.be.deep.equal([true, '0']);
    expect(await this.manager.hasRole(ROLES.SOME_ADMIN, member).then(formatAccess)).to.be.deep.equal([false, '0']);
    expect(await this.manager.hasRole(ROLES.SOME_ADMIN, user).then(formatAccess)).to.be.deep.equal([false, '0']);
    expect(await this.manager.hasRole(ROLES.SOME, admin).then(formatAccess)).to.be.deep.equal([false, '0']);
    expect(await this.manager.hasRole(ROLES.SOME, manager).then(formatAccess)).to.be.deep.equal([false, '0']);
    expect(await this.manager.hasRole(ROLES.SOME, member).then(formatAccess)).to.be.deep.equal([true, '0']);
    expect(await this.manager.hasRole(ROLES.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);
    expect(await this.manager.hasRole(ROLES.PUBLIC, admin).then(formatAccess)).to.be.deep.equal([true, '0']);
    expect(await this.manager.hasRole(ROLES.PUBLIC, manager).then(formatAccess)).to.be.deep.equal([true, '0']);
    expect(await this.manager.hasRole(ROLES.PUBLIC, member).then(formatAccess)).to.be.deep.equal([true, '0']);
    expect(await this.manager.hasRole(ROLES.PUBLIC, user).then(formatAccess)).to.be.deep.equal([true, '0']);
  });

  describe('Roles management', function () {
    describe('label role', function () {
      it('admin can emit a label event', async function () {
        expectEvent(await this.manager.labelRole(ROLES.SOME, 'Some label', { from: admin }), 'RoleLabel', {
          roleId: ROLES.SOME,
          label: 'Some label',
        });
      });

      it('admin can re-emit a label event', async function () {
        await this.manager.labelRole(ROLES.SOME, 'Some label', { from: admin });

        expectEvent(await this.manager.labelRole(ROLES.SOME, 'Updated label', { from: admin }), 'RoleLabel', {
          roleId: ROLES.SOME,
          label: 'Updated label',
        });
      });

      it('emitting a label is restricted', async function () {
        await expectRevertCustomError(
          this.manager.labelRole(ROLES.SOME, 'Invalid label', { from: other }),
          'AccessManagerUnauthorizedAccount',
          [other, ROLES.ADMIN],
        );
      });
    });

    describe('grant role', function () {
      describe('without a grant delay', function () {
        it('without an execute delay', async function () {
          expect(await this.manager.hasRole(ROLES.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);

          const { receipt } = await this.manager.grantRole(ROLES.SOME, user, 0, { from: manager });
          const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
          expectEvent(receipt, 'RoleGranted', {
            roleId: ROLES.SOME,
            account: user,
            since: timestamp,
            delay: '0',
            newMember: true,
          });

          expect(await this.manager.hasRole(ROLES.SOME, user).then(formatAccess)).to.be.deep.equal([true, '0']);

          const access = await this.manager.getAccess(ROLES.SOME, user);
          expect(access[0]).to.be.bignumber.equal(timestamp); // inRoleSince
          expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
          expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
          expect(access[3]).to.be.bignumber.equal('0'); // effect
        });

        it('with an execute delay', async function () {
          expect(await this.manager.hasRole(ROLES.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);

          const { receipt } = await this.manager.grantRole(ROLES.SOME, user, executeDelay, { from: manager });
          const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
          expectEvent(receipt, 'RoleGranted', {
            roleId: ROLES.SOME,
            account: user,
            since: timestamp,
            delay: executeDelay,
            newMember: true,
          });

          expect(await this.manager.hasRole(ROLES.SOME, user).then(formatAccess)).to.be.deep.equal([
            true,
            executeDelay.toString(),
          ]);

          const access = await this.manager.getAccess(ROLES.SOME, user);
          expect(access[0]).to.be.bignumber.equal(timestamp); // inRoleSince
          expect(access[1]).to.be.bignumber.equal(executeDelay); // currentDelay
          expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
          expect(access[3]).to.be.bignumber.equal('0'); // effect
        });

        it('to a user that is already in the role', async function () {
          expect(await this.manager.hasRole(ROLES.SOME, member).then(formatAccess)).to.be.deep.equal([true, '0']);
          await this.manager.grantRole(ROLES.SOME, member, 0, { from: manager });
          expect(await this.manager.hasRole(ROLES.SOME, member).then(formatAccess)).to.be.deep.equal([true, '0']);
        });

        it('to a user that is scheduled for joining the role', async function () {
          await this.manager.$_grantRole(ROLES.SOME, user, 10, 0); // grant delay 10
          expect(await this.manager.hasRole(ROLES.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);
          await this.manager.grantRole(ROLES.SOME, user, 0, { from: manager });
          expect(await this.manager.hasRole(ROLES.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);
        });

        it('grant role is restricted', async function () {
          await expectRevertCustomError(
            this.manager.grantRole(ROLES.SOME, user, 0, { from: other }),
            'AccessManagerUnauthorizedAccount',
            [other, ROLES.SOME_ADMIN],
          );
        });
      });

      describe('with a grant delay', function () {
        beforeEach(async function () {
          await this.manager.$_setGrantDelay(ROLES.SOME, grantDelay);
          await time.increase(MINSETBACK);
        });

        it('granted role is not active immediately', async function () {
          const { receipt } = await this.manager.grantRole(ROLES.SOME, user, 0, { from: manager });
          const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
          expectEvent(receipt, 'RoleGranted', {
            roleId: ROLES.SOME,
            account: user,
            since: timestamp.add(grantDelay),
            delay: '0',
            newMember: true,
          });

          expect(await this.manager.hasRole(ROLES.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);

          const access = await this.manager.getAccess(ROLES.SOME, user);
          expect(access[0]).to.be.bignumber.equal(timestamp.add(grantDelay)); // inRoleSince
          expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
          expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
          expect(access[3]).to.be.bignumber.equal('0'); // effect
        });

        it('granted role is active after the delay', async function () {
          const { receipt } = await this.manager.grantRole(ROLES.SOME, user, 0, { from: manager });
          const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
          expectEvent(receipt, 'RoleGranted', {
            roleId: ROLES.SOME,
            account: user,
            since: timestamp.add(grantDelay),
            delay: '0',
            newMember: true,
          });

          await time.increase(grantDelay);

          expect(await this.manager.hasRole(ROLES.SOME, user).then(formatAccess)).to.be.deep.equal([true, '0']);

          const access = await this.manager.getAccess(ROLES.SOME, user);
          expect(access[0]).to.be.bignumber.equal(timestamp.add(grantDelay)); // inRoleSince
          expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
          expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
          expect(access[3]).to.be.bignumber.equal('0'); // effect
        });
      });

      it('cannot grant public role', async function () {
        await expectRevertCustomError(
          this.manager.$_grantRole(ROLES.PUBLIC, other, 0, executeDelay, { from: manager }),
          'AccessManagerLockedRole',
          [ROLES.PUBLIC],
        );
      });
    });

    describe('revoke role', function () {
      it('from a user that is already in the role', async function () {
        expect(await this.manager.hasRole(ROLES.SOME, member).then(formatAccess)).to.be.deep.equal([true, '0']);

        const { receipt } = await this.manager.revokeRole(ROLES.SOME, member, { from: manager });
        expectEvent(receipt, 'RoleRevoked', { roleId: ROLES.SOME, account: member });

        expect(await this.manager.hasRole(ROLES.SOME, member).then(formatAccess)).to.be.deep.equal([false, '0']);

        const access = await this.manager.getAccess(ROLES.SOME, user);
        expect(access[0]).to.be.bignumber.equal('0'); // inRoleSince
        expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
        expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
        expect(access[3]).to.be.bignumber.equal('0'); // effect
      });

      it('from a user that is scheduled for joining the role', async function () {
        await this.manager.$_grantRole(ROLES.SOME, user, 10, 0); // grant delay 10

        expect(await this.manager.hasRole(ROLES.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);

        const { receipt } = await this.manager.revokeRole(ROLES.SOME, user, { from: manager });
        expectEvent(receipt, 'RoleRevoked', { roleId: ROLES.SOME, account: user });

        expect(await this.manager.hasRole(ROLES.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);

        const access = await this.manager.getAccess(ROLES.SOME, user);
        expect(access[0]).to.be.bignumber.equal('0'); // inRoleSince
        expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
        expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
        expect(access[3]).to.be.bignumber.equal('0'); // effect
      });

      it('from a user that is not in the role', async function () {
        expect(await this.manager.hasRole(ROLES.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);
        await this.manager.revokeRole(ROLES.SOME, user, { from: manager });
        expect(await this.manager.hasRole(ROLES.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);
      });

      it('revoke role is restricted', async function () {
        await expectRevertCustomError(
          this.manager.revokeRole(ROLES.SOME, member, { from: other }),
          'AccessManagerUnauthorizedAccount',
          [other, ROLES.SOME_ADMIN],
        );
      });
    });

    describe('renounce role', function () {
      it('for a user that is already in the role', async function () {
        expect(await this.manager.hasRole(ROLES.SOME, member).then(formatAccess)).to.be.deep.equal([true, '0']);

        const { receipt } = await this.manager.renounceRole(ROLES.SOME, member, { from: member });
        expectEvent(receipt, 'RoleRevoked', { roleId: ROLES.SOME, account: member });

        expect(await this.manager.hasRole(ROLES.SOME, member).then(formatAccess)).to.be.deep.equal([false, '0']);

        const access = await this.manager.getAccess(ROLES.SOME, member);
        expect(access[0]).to.be.bignumber.equal('0'); // inRoleSince
        expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
        expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
        expect(access[3]).to.be.bignumber.equal('0'); // effect
      });

      it('for a user that is schedule for joining the role', async function () {
        await this.manager.$_grantRole(ROLES.SOME, user, 10, 0); // grant delay 10

        expect(await this.manager.hasRole(ROLES.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);

        const { receipt } = await this.manager.renounceRole(ROLES.SOME, user, { from: user });
        expectEvent(receipt, 'RoleRevoked', { roleId: ROLES.SOME, account: user });

        expect(await this.manager.hasRole(ROLES.SOME, user).then(formatAccess)).to.be.deep.equal([false, '0']);

        const access = await this.manager.getAccess(ROLES.SOME, user);
        expect(access[0]).to.be.bignumber.equal('0'); // inRoleSince
        expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
        expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
        expect(access[3]).to.be.bignumber.equal('0'); // effect
      });

      it('for a user that is not in the role', async function () {
        await this.manager.renounceRole(ROLES.SOME, user, { from: user });
      });

      it('bad user confirmation', async function () {
        await expectRevertCustomError(
          this.manager.renounceRole(ROLES.SOME, member, { from: user }),
          'AccessManagerBadConfirmation',
          [],
        );
      });
    });

    describe('change role admin', function () {
      it("admin can set any role's admin", async function () {
        expect(await this.manager.getRoleAdmin(ROLES.SOME)).to.be.bignumber.equal(ROLES.SOME_ADMIN);

        const { receipt } = await this.manager.setRoleAdmin(ROLES.SOME, ROLES.ADMIN, { from: admin });
        expectEvent(receipt, 'RoleAdminChanged', { roleId: ROLES.SOME, admin: ROLES.ADMIN });

        expect(await this.manager.getRoleAdmin(ROLES.SOME)).to.be.bignumber.equal(ROLES.ADMIN);
      });

      it("setting a role's admin is restricted", async function () {
        await expectRevertCustomError(
          this.manager.setRoleAdmin(ROLES.SOME, ROLES.SOME, { from: manager }),
          'AccessManagerUnauthorizedAccount',
          [manager, ROLES.ADMIN],
        );
      });
    });

    describe('change role guardian', function () {
      it("admin can set any role's admin", async function () {
        expect(await this.manager.getRoleGuardian(ROLES.SOME)).to.be.bignumber.equal(ROLES.SOME_ADMIN);

        const { receipt } = await this.manager.setRoleGuardian(ROLES.SOME, ROLES.ADMIN, { from: admin });
        expectEvent(receipt, 'RoleGuardianChanged', { roleId: ROLES.SOME, guardian: ROLES.ADMIN });

        expect(await this.manager.getRoleGuardian(ROLES.SOME)).to.be.bignumber.equal(ROLES.ADMIN);
      });

      it("setting a role's admin is restricted", async function () {
        await expectRevertCustomError(
          this.manager.setRoleGuardian(ROLES.SOME, ROLES.SOME, { from: other }),
          'AccessManagerUnauthorizedAccount',
          [other, ROLES.ADMIN],
        );
      });
    });

    describe('change execution delay', function () {
      it('increasing the delay has immediate effect', async function () {
        const oldDelay = web3.utils.toBN(10);
        const newDelay = web3.utils.toBN(100);

        // role is already granted (with no delay) in the initial setup. this update takes time.
        await this.manager.$_grantRole(ROLES.SOME, member, 0, oldDelay);

        const accessBefore = await this.manager.getAccess(ROLES.SOME, member);
        expect(accessBefore[1]).to.be.bignumber.equal(oldDelay); // currentDelay
        expect(accessBefore[2]).to.be.bignumber.equal('0'); // pendingDelay
        expect(accessBefore[3]).to.be.bignumber.equal('0'); // effect

        const { receipt } = await this.manager.grantRole(ROLES.SOME, member, newDelay, {
          from: manager,
        });
        const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

        expectEvent(receipt, 'RoleGranted', {
          roleId: ROLES.SOME,
          account: member,
          since: timestamp,
          delay: newDelay,
          newMember: false,
        });

        // immediate effect
        const accessAfter = await this.manager.getAccess(ROLES.SOME, member);
        expect(accessAfter[1]).to.be.bignumber.equal(newDelay); // currentDelay
        expect(accessAfter[2]).to.be.bignumber.equal('0'); // pendingDelay
        expect(accessAfter[3]).to.be.bignumber.equal('0'); // effect
      });

      it('decreasing the delay takes time', async function () {
        const oldDelay = web3.utils.toBN(100);
        const newDelay = web3.utils.toBN(10);

        // role is already granted (with no delay) in the initial setup. this update takes time.
        await this.manager.$_grantRole(ROLES.SOME, member, 0, oldDelay);

        const accessBefore = await this.manager.getAccess(ROLES.SOME, member);
        expect(accessBefore[1]).to.be.bignumber.equal(oldDelay); // currentDelay
        expect(accessBefore[2]).to.be.bignumber.equal('0'); // pendingDelay
        expect(accessBefore[3]).to.be.bignumber.equal('0'); // effect

        const { receipt } = await this.manager.grantRole(ROLES.SOME, member, newDelay, {
          from: manager,
        });
        const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
        const setback = oldDelay.sub(newDelay);

        expectEvent(receipt, 'RoleGranted', {
          roleId: ROLES.SOME,
          account: member,
          since: timestamp.add(setback),
          delay: newDelay,
          newMember: false,
        });

        // no immediate effect
        const accessAfter = await this.manager.getAccess(ROLES.SOME, member);
        expect(accessAfter[1]).to.be.bignumber.equal(oldDelay); // currentDelay
        expect(accessAfter[2]).to.be.bignumber.equal(newDelay); // pendingDelay
        expect(accessAfter[3]).to.be.bignumber.equal(timestamp.add(setback)); // effect

        // delayed effect
        await time.increase(setback);
        const accessAfterSetback = await this.manager.getAccess(ROLES.SOME, member);
        expect(accessAfterSetback[1]).to.be.bignumber.equal(newDelay); // currentDelay
        expect(accessAfterSetback[2]).to.be.bignumber.equal('0'); // pendingDelay
        expect(accessAfterSetback[3]).to.be.bignumber.equal('0'); // effect
      });

      it('can set a user execution delay during the grant delay', async function () {
        await this.manager.$_grantRole(ROLES.SOME, other, 10, 0);
        // here: "other" is pending to get the role, but doesn't yet have it.

        const { receipt } = await this.manager.grantRole(ROLES.SOME, other, executeDelay, { from: manager });
        const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

        // increasing the execution delay from 0 to executeDelay is immediate
        expectEvent(receipt, 'RoleGranted', {
          roleId: ROLES.SOME,
          account: other,
          since: timestamp,
          delay: executeDelay,
          newMember: false,
        });
      });
    });

    describe('change grant delay', function () {
      it('increasing the delay has immediate effect', async function () {
        const oldDelay = web3.utils.toBN(10);
        const newDelay = web3.utils.toBN(100);

        await this.manager.$_setGrantDelay(ROLES.SOME, oldDelay);
        await time.increase(MINSETBACK);

        expect(await this.manager.getRoleGrantDelay(ROLES.SOME)).to.be.bignumber.equal(oldDelay);

        const { receipt } = await this.manager.setGrantDelay(ROLES.SOME, newDelay, { from: admin });
        const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
        const setback = web3.utils.BN.max(MINSETBACK, oldDelay.sub(newDelay));

        expect(setback).to.be.bignumber.equal(MINSETBACK);
        expectEvent(receipt, 'RoleGrantDelayChanged', {
          roleId: ROLES.SOME,
          delay: newDelay,
          since: timestamp.add(setback),
        });

        expect(await this.manager.getRoleGrantDelay(ROLES.SOME)).to.be.bignumber.equal(oldDelay);
        await time.increase(setback);
        expect(await this.manager.getRoleGrantDelay(ROLES.SOME)).to.be.bignumber.equal(newDelay);
      });

      it('increasing the delay has delay effect #1', async function () {
        const oldDelay = web3.utils.toBN(100);
        const newDelay = web3.utils.toBN(10);

        await this.manager.$_setGrantDelay(ROLES.SOME, oldDelay);
        await time.increase(MINSETBACK);

        expect(await this.manager.getRoleGrantDelay(ROLES.SOME)).to.be.bignumber.equal(oldDelay);

        const { receipt } = await this.manager.setGrantDelay(ROLES.SOME, newDelay, { from: admin });
        const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
        const setback = web3.utils.BN.max(MINSETBACK, oldDelay.sub(newDelay));

        expect(setback).to.be.bignumber.equal(MINSETBACK);
        expectEvent(receipt, 'RoleGrantDelayChanged', {
          roleId: ROLES.SOME,
          delay: newDelay,
          since: timestamp.add(setback),
        });

        expect(await this.manager.getRoleGrantDelay(ROLES.SOME)).to.be.bignumber.equal(oldDelay);
        await time.increase(setback);
        expect(await this.manager.getRoleGrantDelay(ROLES.SOME)).to.be.bignumber.equal(newDelay);
      });

      it('increasing the delay has delay effect #2', async function () {
        const oldDelay = time.duration.days(30); // more than the minsetback
        const newDelay = web3.utils.toBN(10);

        await this.manager.$_setGrantDelay(ROLES.SOME, oldDelay);
        await time.increase(MINSETBACK);

        expect(await this.manager.getRoleGrantDelay(ROLES.SOME)).to.be.bignumber.equal(oldDelay);

        const { receipt } = await this.manager.setGrantDelay(ROLES.SOME, newDelay, { from: admin });
        const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
        const setback = web3.utils.BN.max(MINSETBACK, oldDelay.sub(newDelay));

        expect(setback).to.be.bignumber.gt(MINSETBACK);
        expectEvent(receipt, 'RoleGrantDelayChanged', {
          roleId: ROLES.SOME,
          delay: newDelay,
          since: timestamp.add(setback),
        });

        expect(await this.manager.getRoleGrantDelay(ROLES.SOME)).to.be.bignumber.equal(oldDelay);
        await time.increase(setback);
        expect(await this.manager.getRoleGrantDelay(ROLES.SOME)).to.be.bignumber.equal(newDelay);
      });

      it('changing the grant delay is restricted', async function () {
        await expectRevertCustomError(
          this.manager.setGrantDelay(ROLES.SOME, grantDelay, { from: other }),
          'AccessManagerUnauthorizedAccount',
          [ROLES.ADMIN, other],
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
      this.execute = (opts = {}) => this.manager.execute(...this.call, { from: user, ...opts });
      this.cancel = (opts = {}) => this.manager.cancel(user, ...this.call, { from: user, ...opts });
    });

    describe('Change function permissions', function () {
      const sigs = ['someFunction()', 'someOtherFunction(uint256)', 'oneMoreFunction(address,uint8)'].map(selector);

      it('admin can set function role', async function () {
        for (const sig of sigs) {
          expect(await this.manager.getTargetFunctionRole(this.target.address, sig)).to.be.bignumber.equal(ROLES.ADMIN);
        }

        const { receipt: receipt1 } = await this.manager.setTargetFunctionRole(this.target.address, sigs, ROLES.SOME, {
          from: admin,
        });

        for (const sig of sigs) {
          expectEvent(receipt1, 'TargetFunctionRoleUpdated', {
            target: this.target.address,
            selector: sig,
            roleId: ROLES.SOME,
          });
          expect(await this.manager.getTargetFunctionRole(this.target.address, sig)).to.be.bignumber.equal(ROLES.SOME);
        }

        const { receipt: receipt2 } = await this.manager.setTargetFunctionRole(
          this.target.address,
          [sigs[1]],
          ROLES.SOME_ADMIN,
          {
            from: admin,
          },
        );
        expectEvent(receipt2, 'TargetFunctionRoleUpdated', {
          target: this.target.address,
          selector: sigs[1],
          roleId: ROLES.SOME_ADMIN,
        });

        for (const sig of sigs) {
          expect(await this.manager.getTargetFunctionRole(this.target.address, sig)).to.be.bignumber.equal(
            sig == sigs[1] ? ROLES.SOME_ADMIN : ROLES.SOME,
          );
        }
      });

      it('non-admin cannot set function role', async function () {
        await expectRevertCustomError(
          this.manager.setTargetFunctionRole(this.target.address, sigs, ROLES.SOME, { from: other }),
          'AccessManagerUnauthorizedAccount',
          [other, ROLES.ADMIN],
        );
      });
    });

    // WIP
    describe('Calling restricted & unrestricted functions', function () {
      for (const [callerRoles, fnRole, closed, delay] of product(
        [[], [ROLES.SOME]],
        [undefined, ROLES.ADMIN, ROLES.SOME, ROLES.PUBLIC],
        [false, true],
        [null, executeDelay],
      )) {
        // can we call with a delay ?
        const indirectSuccess = (fnRole == ROLES.PUBLIC || callerRoles.includes(fnRole)) && !closed;

        // can we call without a delay ?
        const directSuccess = (fnRole == ROLES.PUBLIC || (callerRoles.includes(fnRole) && !delay)) && !closed;

        const description = [
          'Caller in roles',
          '[' + (callerRoles ?? []).map(roleId => ROLES[roleId]).join(', ') + ']',
          delay ? 'with a delay' : 'without a delay',
          '+',
          'functions open to roles',
          '[' + (ROLES[fnRole] ?? '') + ']',
          closed ? `(closed)` : '',
        ].join(' ');

        describe(description, function () {
          beforeEach(async function () {
            if (!delay || fnRole === ROLES.PUBLIC) this.skip(); // TODO: Fixed in #4613

            // setup
            await Promise.all([
              this.manager.$_setTargetClosed(this.target.address, closed),
              fnRole && this.manager.$_setTargetFunctionRole(this.target.address, selector('fnRestricted()'), fnRole),
              fnRole && this.manager.$_setTargetFunctionRole(this.target.address, selector('fnUnrestricted()'), fnRole),
              ...callerRoles
                .filter(roleId => roleId != ROLES.PUBLIC)
                .map(roleId => this.manager.$_grantRole(roleId, user, 0, delay ?? 0)),
            ]);

            // post setup checks
            expect(await this.manager.isTargetClosed(this.target.address)).to.be.equal(closed);

            if (fnRole) {
              expect(
                await this.manager.getTargetFunctionRole(this.target.address, selector('fnRestricted()')),
              ).to.be.bignumber.equal(fnRole);
              expect(
                await this.manager.getTargetFunctionRole(this.target.address, selector('fnUnrestricted()')),
              ).to.be.bignumber.equal(fnRole);
            }

            for (const roleId of callerRoles) {
              const access = await this.manager.getAccess(roleId, user);
              if (roleId == ROLES.PUBLIC) {
                expect(access[0]).to.be.bignumber.equal('0'); // inRoleSince
                expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
                expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
                expect(access[3]).to.be.bignumber.equal('0'); // effect
              } else {
                expect(access[0]).to.be.bignumber.gt('0'); // inRoleSince
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

          it('Calling indirectly: only execute', async function () {
            // execute without schedule
            if (directSuccess) {
              const nonceBefore = await this.manager.getNonce(this.opId);
              const { receipt, tx } = await this.execute();

              expectEvent.notEmitted(receipt, 'OperationExecuted', { operationId: this.opId });
              await expectEvent.inTransaction(tx, this.target, 'CalledRestricted', { caller: this.manager.address });

              // nonce is not modified
              expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore);
            } else if (indirectSuccess) {
              await expectRevertCustomError(this.execute(), 'AccessManagerNotScheduled', [this.opId]);
            } else {
              await expectRevertCustomError(this.execute(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
            }
          });

          it('Calling indirectly: schedule and execute', async function () {
            if (directSuccess || indirectSuccess) {
              const nonceBefore = await this.manager.getNonce(this.opId);
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

              // nonce is incremented
              expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));

              // execute without wait
              if (directSuccess) {
                const { receipt, tx } = await this.execute();

                await expectEvent.inTransaction(tx, this.target, 'CalledRestricted', { caller: this.manager.address });
                if (delay && fnRole !== ROLES.PUBLIC) {
                  expectEvent(receipt, 'OperationExecuted', { operationId: this.opId });
                  expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal('0');
                }

                // nonce is not modified by execute
                expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));
              } else if (indirectSuccess) {
                await expectRevertCustomError(this.execute(), 'AccessManagerNotReady', [this.opId]);
              } else {
                await expectRevertCustomError(this.execute(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
              }
            } else {
              await expectRevertCustomError(this.schedule(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
            }
          });

          it('Calling indirectly: schedule wait and execute', async function () {
            if (directSuccess || indirectSuccess) {
              const nonceBefore = await this.manager.getNonce(this.opId);
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

              // nonce is incremented
              expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));

              // wait
              await time.increase(delay ?? 0);

              // execute without wait
              if (directSuccess || indirectSuccess) {
                const { receipt, tx } = await this.execute();

                await expectEvent.inTransaction(tx, this.target, 'CalledRestricted', { caller: this.manager.address });
                if (delay && fnRole !== ROLES.PUBLIC) {
                  expectEvent(receipt, 'OperationExecuted', { operationId: this.opId });
                  expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal('0');
                }

                // nonce is not modified by execute
                expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));
              } else {
                await expectRevertCustomError(this.execute(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
              }
            } else {
              await expectRevertCustomError(this.schedule(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
            }
          });

          it('Calling directly: schedule and call', async function () {
            if (directSuccess || indirectSuccess) {
              const nonceBefore = await this.manager.getNonce(this.opId);
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

              // nonce is incremented
              expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));

              // execute without wait
              const promise = this.direct();
              if (directSuccess) {
                expectEvent(await promise, 'CalledRestricted', { caller: user });

                // schedule is not reset
                expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(schedule);

                // nonce is not modified by execute
                expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));
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
              const nonceBefore = await this.manager.getNonce(this.opId);
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

              // nonce is incremented
              expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));

              // wait
              await time.increase(delay ?? 0);

              // execute without wait
              const promise = await this.direct();
              if (directSuccess) {
                expectEvent(await promise, 'CalledRestricted', { caller: user });

                // schedule is not reset
                expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(schedule);

                // nonce is not modified by execute
                expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));
              } else if (indirectSuccess) {
                const receipt = await promise;

                expectEvent(receipt, 'CalledRestricted', { caller: user });
                await expectEvent.inTransaction(receipt.tx, this.manager, 'OperationExecuted', {
                  operationId: this.opId,
                });

                // schedule is reset
                expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal('0');

                // nonce is not modified by execute
                expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));
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
        await this.manager.$_setTargetFunctionRole(this.target.address, this.callData, ROLES.SOME);
        await this.manager.$_grantRole(ROLES.SOME, user, 0, executeDelay);
      });

      it('Checking canCall when caller is the manager depend on the _executionId', async function () {
        const result = await this.manager.canCall(this.manager.address, this.target.address, '0x00000000');
        expect(result[0]).to.be.false;
        expect(result[1]).to.be.bignumber.equal('0');
      });

      it('Cannot execute earlier', async function () {
        const { receipt } = await this.schedule();
        const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

        expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(timestamp.add(executeDelay));

        // too early
        await helpers.time.setNextBlockTimestamp(timestamp.add(executeDelay).subn(1));
        await expectRevertCustomError(this.execute(), 'AccessManagerNotReady', [this.opId]);

        // the revert happened one second before the execution delay expired
        expect(await time.latest()).to.be.bignumber.equal(timestamp.add(executeDelay).subn(1));

        // ok
        await helpers.time.setNextBlockTimestamp(timestamp.add(executeDelay));
        await this.execute();

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

      it('Cannot cancel an operation that is already executed', async function () {
        await this.schedule();
        await time.increase(executeDelay);
        await this.execute();

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

        await expectRevertCustomError(this.cancel({ from: other }), 'AccessManagerUnauthorizedCancel', [
          other,
          user,
          ...this.call,
        ]);

        expect(await this.manager.getSchedule(this.opId)).to.not.be.bignumber.equal('0');
      });

      it('Can re-schedule after execution', async function () {
        await this.schedule();
        await time.increase(executeDelay);
        await this.execute();

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
    const roleId = web3.utils.toBN(1);

    beforeEach(async function () {
      this.ownable = await Ownable.new(this.manager.address);

      // add user to role
      await this.manager.$_grantRole(roleId, user, 0, 0);
    });

    it('initial state', async function () {
      expect(await this.ownable.owner()).to.be.equal(this.manager.address);
    });

    describe('Contract is closed', function () {
      beforeEach(async function () {
        await this.manager.$_setTargetClosed(this.ownable.address, true);
      });

      it('directly call: reverts', async function () {
        await expectRevertCustomError(this.ownable.$_checkOwner({ from: user }), 'OwnableUnauthorizedAccount', [user]);
      });

      it('relayed call (with role): reverts', async function () {
        await expectRevertCustomError(
          this.manager.execute(this.ownable.address, selector('$_checkOwner()'), { from: user }),
          'AccessManagerUnauthorizedCall',
          [user, this.ownable.address, selector('$_checkOwner()')],
        );
      });

      it('relayed call (without role): reverts', async function () {
        await expectRevertCustomError(
          this.manager.execute(this.ownable.address, selector('$_checkOwner()'), { from: other }),
          'AccessManagerUnauthorizedCall',
          [other, this.ownable.address, selector('$_checkOwner()')],
        );
      });
    });

    describe('Contract is managed', function () {
      describe('function is open to specific role', function () {
        beforeEach(async function () {
          await this.manager.$_setTargetFunctionRole(this.ownable.address, selector('$_checkOwner()'), roleId);
        });

        it('directly call: reverts', async function () {
          await expectRevertCustomError(this.ownable.$_checkOwner({ from: user }), 'OwnableUnauthorizedAccount', [
            user,
          ]);
        });

        it('relayed call (with role): success', async function () {
          await this.manager.execute(this.ownable.address, selector('$_checkOwner()'), { from: user });
        });

        it('relayed call (without role): reverts', async function () {
          await expectRevertCustomError(
            this.manager.execute(this.ownable.address, selector('$_checkOwner()'), { from: other }),
            'AccessManagerUnauthorizedCall',
            [other, this.ownable.address, selector('$_checkOwner()')],
          );
        });
      });

      describe('function is open to public role', function () {
        beforeEach(async function () {
          await this.manager.$_setTargetFunctionRole(this.ownable.address, selector('$_checkOwner()'), ROLES.PUBLIC);
        });

        it('directly call: reverts', async function () {
          await expectRevertCustomError(this.ownable.$_checkOwner({ from: user }), 'OwnableUnauthorizedAccount', [
            user,
          ]);
        });

        it('relayed call (with role): success', async function () {
          await this.manager.execute(this.ownable.address, selector('$_checkOwner()'), { from: user });
        });

        it('relayed call (without role): success', async function () {
          await this.manager.execute(this.ownable.address, selector('$_checkOwner()'), { from: other });
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
        [other, ROLES.ADMIN],
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

  // TODO:
  // - check opening/closing a contract
  // - check updating the contract delay
  // - check the delay applies to admin function
  describe.skip('contract modes', function () {});
});
