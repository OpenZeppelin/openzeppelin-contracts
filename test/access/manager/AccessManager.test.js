const { web3 } = require('hardhat');
const { constants, expectEvent, time } = require('@openzeppelin/test-helpers');
const { expectRevertCustomError } = require('../../helpers/customError');
const { selector } = require('../../helpers/methods');
const { clockFromReceipt } = require('../../helpers/time');
const { buildBaseRoles, formatAccess } = require('../../helpers/access-manager');
const { product } = require('../../helpers/iterate');
const helpers = require('@nomicfoundation/hardhat-network-helpers');
const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');
const {
  shouldBehaveLikeNotDelayedAdminOperation,
  shouldBehaveLikeGetAccess,
  shouldBehaveLikeHasRole,
  shouldBehaveLikeCanCallExecuting,
  shouldBehaveLikeCanCallSelf,
  scheduleOperation,
  shouldBehaveLikeDelayedOperation,
  shouldBehaveLikeDelayedAdminOperation,
  shouldBehaveLikeANotDelayedAdminOperation,
} = require('./AccessManager.behavior');
const { assert } = require('chai');
const { default: Wallet } = require('ethereumjs-wallet');
const { computeCreateAddress } = require('../../helpers/create');

const AccessManager = artifacts.require('$AccessManager');
const AccessManagedTarget = artifacts.require('$AccessManagedTarget');
const Ownable = artifacts.require('$Ownable');

const grantDelay = web3.utils.toBN(15);
const executeDelay = web3.utils.toBN(10);
const MINSETBACK = time.duration.days(5);
const EXPIRATION = time.duration.weeks(1);

const BASE_ROLES = buildBaseRoles();

contract('AccessManager', function (accounts) {
  const [admin, manager, guardian, member, user, other] = accounts;

  // Add members
  BASE_ROLES.ADMIN.members = [admin];
  BASE_ROLES.SOME_ADMIN.members = [manager];
  BASE_ROLES.SOME_GUARDIAN.members = [guardian];
  BASE_ROLES.SOME.members = [member];
  BASE_ROLES.PUBLIC.members = [admin, manager, guardian, member, user, other];

  beforeEach(async function () {
    this.roles = BASE_ROLES;
    this.manager = await AccessManager.new(admin);
    this.target = await AccessManagedTarget.new(this.manager.address);

    for (const { id: roleId, admin, guardian, members } of Object.values(BASE_ROLES)) {
      if (roleId === this.roles.PUBLIC.id) continue; // Every address belong to public and is locked
      if (roleId === this.roles.ADMIN.id) continue; // Admin set during construction and is locked

      // Set admin role avoiding default
      if (admin.id !== this.roles.ADMIN.id) {
        await this.manager.$_setRoleAdmin(roleId, admin.id);
      }

      // Set guardian role avoiding default
      if (guardian.id !== this.roles.ADMIN.id) {
        await this.manager.$_setRoleGuardian(roleId, guardian.id);
      }

      // Grant role to members
      for (const member of members) {
        await this.manager.$_grantRole(roleId, member, 0, 0);
      }
    }
  });

  describe('during construction', async function () {
    it('grants admin role to initialAdmin', async function () {
      const manager = await AccessManager.new(other);
      expect(await manager.hasRole(this.roles.ADMIN.id, other).then(formatAccess)).to.be.deep.equal([true, '0']);
    });

    it('rejects zero address for initialAdmin', async function () {
      await expectRevertCustomError(AccessManager.new(constants.ZERO_ADDRESS), 'AccessManagerInvalidInitialAdmin', [
        constants.ZERO_ADDRESS,
      ]);
    });

    it('initializes setup roles correctly', async function () {
      for (const { id: roleId, admin, guardian, members } of Object.values(BASE_ROLES)) {
        expect(await this.manager.getRoleAdmin(roleId)).to.be.bignumber.equal(admin.id);
        expect(await this.manager.getRoleGuardian(roleId)).to.be.bignumber.equal(guardian.id);

        const isMember = Object.fromEntries(members.map(member => [member, true]));

        for (const user of this.roles.PUBLIC.members) {
          expect(await this.manager.hasRole(roleId, user).then(formatAccess)).to.be.deep.equal([!!isMember[user], '0']);
        }
      }
    });
  });

  describe('getters', async function () {
    it('has a 7 days default expiration', async function () {
      expect(await this.manager.expiration()).to.be.bignumber.equal(EXPIRATION);
    });

    it('has a 5 days default minimum setback', async function () {
      expect(await this.manager.minSetback()).to.be.bignumber.equal(MINSETBACK);
    });

    describe('isTargetClosed()', function () {
      describe('when closed', function () {});
    });

    describe('getTargetFunctionRole()', function () {});
    describe('getTargetAdminDelay()', function () {});
    describe('getRoleAdmin()', function () {});
    describe('getRoleGuardian()', function () {});
    describe('getRoleGrantDelay()', function () {});
    describe('getAccess()', function () {});
    describe('hasRole()', function () {});
  });

  describe('delayed admin operations', function () {
    describe('#labelRole', function () {
      beforeEach('set method and args', async function () {
        this.method = 'labelRole(uint64,string)';
        this.args = [123443, 'TEST'];
      });

      shouldBehaveLikeDelayedAdminOperation();

      it('emits an event with the label', async function () {
        expectEvent(await this.manager.labelRole(this.roles.SOME.id, 'Some label', { from: admin }), 'RoleLabel', {
          roleId: this.roles.SOME.id,
          label: 'Some label',
        });
      });

      it('updates label on a second call', async function () {
        await this.manager.labelRole(this.roles.SOME.id, 'Some label', { from: admin });

        expectEvent(await this.manager.labelRole(this.roles.SOME.id, 'Updated label', { from: admin }), 'RoleLabel', {
          roleId: this.roles.SOME.id,
          label: 'Updated label',
        });
      });

      it('reverts labeling PUBLIC_ROLE', async function () {
        await expectRevertCustomError(
          this.manager.labelRole(this.roles.PUBLIC.id, 'Some label', { from: admin }),
          'AccessManagerLockedRole',
          [this.roles.PUBLIC.id],
        );
      });

      it('reverts labeling ADMIN_ROLE', async function () {
        await expectRevertCustomError(
          this.manager.labelRole(this.roles.ADMIN.id, 'Some label', { from: admin }),
          'AccessManagerLockedRole',
          [this.roles.ADMIN.id],
        );
      });
    });

    describe('#setRoleAdmin', function () {
      beforeEach('set method and args', async function () {
        this.method = 'setRoleAdmin(uint64,uint64)';
        this.args = [93445, 84532];
      });

      shouldBehaveLikeDelayedAdminOperation();

      it("sets any role's admin if called by an admin", async function () {
        expect(await this.manager.getRoleAdmin(this.roles.SOME.id)).to.be.bignumber.equal(this.roles.SOME_ADMIN.id);

        const { receipt } = await this.manager.setRoleAdmin(this.roles.SOME.id, this.roles.ADMIN.id, { from: admin });
        expectEvent(receipt, 'RoleAdminChanged', { roleId: this.roles.SOME.id, admin: this.roles.ADMIN.id });

        expect(await this.manager.getRoleAdmin(this.roles.SOME.id)).to.be.bignumber.equal(this.roles.ADMIN.id);
      });

      it('reverts setting PUBLIC_ROLE admin', async function () {
        await expectRevertCustomError(
          this.manager.setRoleAdmin(this.roles.PUBLIC.id, this.roles.ADMIN.id, { from: admin }),
          'AccessManagerLockedRole',
          [this.roles.PUBLIC.id],
        );
      });

      it('reverts setting ADMIN_ROLE admin', async function () {
        await expectRevertCustomError(
          this.manager.setRoleAdmin(this.roles.ADMIN.id, this.roles.ADMIN.id, { from: admin }),
          'AccessManagerLockedRole',
          [this.roles.ADMIN.id],
        );
      });
    });

    describe('#setRoleGuardian', function () {
      beforeEach('set method and args', async function () {
        this.method = 'setRoleGuardian(uint64,uint64)';
        this.args = [93445, 84532];
      });

      shouldBehaveLikeDelayedAdminOperation();

      it("sets any role's guardian if called by an admin", async function () {
        expect(await this.manager.getRoleGuardian(this.roles.SOME.id)).to.be.bignumber.equal(
          this.roles.SOME_GUARDIAN.id,
        );

        const { receipt } = await this.manager.setRoleGuardian(this.roles.SOME.id, this.roles.ADMIN.id, {
          from: admin,
        });
        expectEvent(receipt, 'RoleGuardianChanged', { roleId: this.roles.SOME.id, guardian: this.roles.ADMIN.id });

        expect(await this.manager.getRoleGuardian(this.roles.SOME.id)).to.be.bignumber.equal(this.roles.ADMIN.id);
      });

      it('reverts setting PUBLIC_ROLE admin', async function () {
        await expectRevertCustomError(
          this.manager.setRoleGuardian(this.roles.PUBLIC.id, this.roles.ADMIN.id, { from: admin }),
          'AccessManagerLockedRole',
          [this.roles.PUBLIC.id],
        );
      });

      it('reverts setting ADMIN_ROLE admin', async function () {
        await expectRevertCustomError(
          this.manager.setRoleGuardian(this.roles.ADMIN.id, this.roles.ADMIN.id, { from: admin }),
          'AccessManagerLockedRole',
          [this.roles.ADMIN.id],
        );
      });
    });

    describe('#setGrantDelay', function () {
      beforeEach('set method and args', async function () {
        this.method = 'setGrantDelay(uint64,uint32)';
        this.args = [984910, time.duration.days(2)];
      });

      shouldBehaveLikeDelayedAdminOperation();

      it('immediately sets an increased delay', async function () {
        const oldDelay = web3.utils.toBN(10);
        const newDelay = web3.utils.toBN(100);

        await this.manager.$_setGrantDelay(this.roles.SOME.id, oldDelay);
        await time.increase(MINSETBACK);

        expect(await this.manager.getRoleGrantDelay(this.roles.SOME.id)).to.be.bignumber.equal(oldDelay);

        const { receipt } = await this.manager.setGrantDelay(this.roles.SOME.id, newDelay, { from: admin });
        const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
        const setback = web3.utils.BN.max(MINSETBACK, oldDelay.sub(newDelay));

        expect(setback).to.be.bignumber.equal(MINSETBACK);
        expectEvent(receipt, 'RoleGrantDelayChanged', {
          roleId: this.roles.SOME.id,
          delay: newDelay,
          since: timestamp.add(setback),
        });

        expect(await this.manager.getRoleGrantDelay(this.roles.SOME.id)).to.be.bignumber.equal(oldDelay);
        await time.increase(setback);
        expect(await this.manager.getRoleGrantDelay(this.roles.SOME.id)).to.be.bignumber.equal(newDelay);
      });

      it('sets a reduced delay after minimum setback if its difference with current delay is too low', async function () {
        const oldDelay = web3.utils.toBN(100);
        const newDelay = web3.utils.toBN(10);

        await this.manager.$_setGrantDelay(this.roles.SOME.id, oldDelay);
        await time.increase(MINSETBACK);

        expect(await this.manager.getRoleGrantDelay(this.roles.SOME.id)).to.be.bignumber.equal(oldDelay);

        const { receipt } = await this.manager.setGrantDelay(this.roles.SOME.id, newDelay, { from: admin });
        const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
        const setback = web3.utils.BN.max(MINSETBACK, oldDelay.sub(newDelay));

        expect(setback).to.be.bignumber.equal(MINSETBACK);
        expectEvent(receipt, 'RoleGrantDelayChanged', {
          roleId: this.roles.SOME.id,
          delay: newDelay,
          since: timestamp.add(setback),
        });

        expect(await this.manager.getRoleGrantDelay(this.roles.SOME.id)).to.be.bignumber.equal(oldDelay);
        await time.increase(setback);
        expect(await this.manager.getRoleGrantDelay(this.roles.SOME.id)).to.be.bignumber.equal(newDelay);
      });

      it('sets a reduced delay after the difference between the old delay and the new delay if its higher than minimum setback', async function () {
        const oldDelay = time.duration.days(30); // more than the minsetback
        const newDelay = web3.utils.toBN(10);

        await this.manager.$_setGrantDelay(this.roles.SOME.id, oldDelay);
        await time.increase(MINSETBACK);

        expect(await this.manager.getRoleGrantDelay(this.roles.SOME.id)).to.be.bignumber.equal(oldDelay);

        const { receipt } = await this.manager.setGrantDelay(this.roles.SOME.id, newDelay, { from: admin });
        const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
        const setback = web3.utils.BN.max(MINSETBACK, oldDelay.sub(newDelay));

        expect(setback).to.be.bignumber.gt(MINSETBACK);
        expectEvent(receipt, 'RoleGrantDelayChanged', {
          roleId: this.roles.SOME.id,
          delay: newDelay,
          since: timestamp.add(setback),
        });

        expect(await this.manager.getRoleGrantDelay(this.roles.SOME.id)).to.be.bignumber.equal(oldDelay);
        await time.increase(setback);
        expect(await this.manager.getRoleGrantDelay(this.roles.SOME.id)).to.be.bignumber.equal(newDelay);
      });

      it('changing the grant delay is restricted', async function () {
        await expectRevertCustomError(
          this.manager.setGrantDelay(this.roles.SOME.id, grantDelay, { from: other }),
          'AccessManagerUnauthorizedAccount',
          [this.roles.ADMIN.id, other],
        );
      });
    });

    describe('#setTargetAdminDelay', function () {
      beforeEach('set method and args', async function () {
        this.method = 'setTargetAdminDelay(address,uint32)';
        this.args = [Wallet.generate().getChecksumAddressString(), time.duration.days(3)];
      });

      shouldBehaveLikeDelayedAdminOperation();

      it('immediately sets an increased delay', async function () {
        const oldDelay = web3.utils.toBN(10);
        const newDelay = web3.utils.toBN(100);

        await this.manager.$_setGrantDelay(this.roles.SOME.id, oldDelay);
        await time.increase(MINSETBACK);

        expect(await this.manager.getRoleGrantDelay(this.roles.SOME.id)).to.be.bignumber.equal(oldDelay);

        const { receipt } = await this.manager.setGrantDelay(this.roles.SOME.id, newDelay, { from: admin });
        const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
        const setback = web3.utils.BN.max(MINSETBACK, oldDelay.sub(newDelay));

        expect(setback).to.be.bignumber.equal(MINSETBACK);
        expectEvent(receipt, 'RoleGrantDelayChanged', {
          roleId: this.roles.SOME.id,
          delay: newDelay,
          since: timestamp.add(setback),
        });

        expect(await this.manager.getRoleGrantDelay(this.roles.SOME.id)).to.be.bignumber.equal(oldDelay);
        await time.increase(setback);
        expect(await this.manager.getRoleGrantDelay(this.roles.SOME.id)).to.be.bignumber.equal(newDelay);
      });

      it('sets a reduced delay after minimum setback if its difference with current delay is too low', async function () {
        const oldDelay = web3.utils.toBN(100);
        const newDelay = web3.utils.toBN(10);

        await this.manager.$_setGrantDelay(this.roles.SOME.id, oldDelay);
        await time.increase(MINSETBACK);

        expect(await this.manager.getRoleGrantDelay(this.roles.SOME.id)).to.be.bignumber.equal(oldDelay);

        const { receipt } = await this.manager.setGrantDelay(this.roles.SOME.id, newDelay, { from: admin });
        const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
        const setback = web3.utils.BN.max(MINSETBACK, oldDelay.sub(newDelay));

        expect(setback).to.be.bignumber.equal(MINSETBACK);
        expectEvent(receipt, 'RoleGrantDelayChanged', {
          roleId: this.roles.SOME.id,
          delay: newDelay,
          since: timestamp.add(setback),
        });

        expect(await this.manager.getRoleGrantDelay(this.roles.SOME.id)).to.be.bignumber.equal(oldDelay);
        await time.increase(setback);
        expect(await this.manager.getRoleGrantDelay(this.roles.SOME.id)).to.be.bignumber.equal(newDelay);
      });

      it('sets a reduced delay after the difference between the old delay and the new delay if its higher than minimum setback', async function () {
        const oldDelay = time.duration.days(30); // more than the minsetback
        const newDelay = web3.utils.toBN(10);

        await this.manager.$_setGrantDelay(this.roles.SOME.id, oldDelay);
        await time.increase(MINSETBACK);

        expect(await this.manager.getRoleGrantDelay(this.roles.SOME.id)).to.be.bignumber.equal(oldDelay);

        const { receipt } = await this.manager.setGrantDelay(this.roles.SOME.id, newDelay, { from: admin });
        const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
        const setback = web3.utils.BN.max(MINSETBACK, oldDelay.sub(newDelay));

        expect(setback).to.be.bignumber.gt(MINSETBACK);
        expectEvent(receipt, 'RoleGrantDelayChanged', {
          roleId: this.roles.SOME.id,
          delay: newDelay,
          since: timestamp.add(setback),
        });

        expect(await this.manager.getRoleGrantDelay(this.roles.SOME.id)).to.be.bignumber.equal(oldDelay);
        await time.increase(setback);
        expect(await this.manager.getRoleGrantDelay(this.roles.SOME.id)).to.be.bignumber.equal(newDelay);
      });

      it('changing the grant delay is restricted', async function () {
        await expectRevertCustomError(
          this.manager.setGrantDelay(this.roles.SOME.id, grantDelay, { from: other }),
          'AccessManagerUnauthorizedAccount',
          [this.roles.ADMIN.id, other],
        );
      });
    });
  });

  describe('not delayed admin operations', function () {
    describe('#updateAuthority', function () {
      beforeEach('set method and args', async function () {
        this.method = 'updateAuthority(address,address)';
        this.newAuthority = await AccessManager.new(admin);
        this.args = [this.target.address, this.newAuthority.address];
      });

      shouldBehaveLikeANotDelayedAdminOperation();
    });

    describe('#setTargetClosed', function () {
      beforeEach('set method and args', async function () {
        this.method = 'setTargetClosed(address,bool)';
        this.args = [Wallet.generate().getChecksumAddressString(), true];
      });

      shouldBehaveLikeANotDelayedAdminOperation();
    });

    describe('#setTargetFunctionRole', function () {
      beforeEach('set method and args', async function () {
        this.method = 'setTargetFunctionRole(address,bytes4[],uint64)';
        this.args = [Wallet.generate().getChecksumAddressString(), ['0x12345678'], 443342];
      });

      shouldBehaveLikeANotDelayedAdminOperation();
    });
  });

  // describe('Roles management', function () {
  //   describe('grant role', function () {
  //     describe('without a grant delay', function () {
  //       it('without an execute delay', async function () {
  //         expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([
  //           false,
  //           '0',
  //         ]);

  //         const { receipt } = await this.manager.grantRole(this.roles.SOME.id, user, 0, { from: manager });
  //         const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
  //         expectEvent(receipt, 'RoleGranted', {
  //           roleId: this.roles.SOME.id,
  //           account: user,
  //           since: timestamp,
  //           delay: '0',
  //           newMember: true,
  //         });

  //         expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([true, '0']);

  //         const access = await this.manager.getAccess(this.roles.SOME.id, user);
  //         expect(access[0]).to.be.bignumber.equal(timestamp); // inRoleSince
  //         expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
  //         expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
  //         expect(access[3]).to.be.bignumber.equal('0'); // effect
  //       });

  //       it('with an execute delay', async function () {
  //         expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([
  //           false,
  //           '0',
  //         ]);

  //         const { receipt } = await this.manager.grantRole(this.roles.SOME.id, user, executeDelay, { from: manager });
  //         const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
  //         expectEvent(receipt, 'RoleGranted', {
  //           roleId: this.roles.SOME.id,
  //           account: user,
  //           since: timestamp,
  //           delay: executeDelay,
  //           newMember: true,
  //         });

  //         expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([
  //           true,
  //           executeDelay.toString(),
  //         ]);

  //         const access = await this.manager.getAccess(this.roles.SOME.id, user);
  //         expect(access[0]).to.be.bignumber.equal(timestamp); // inRoleSince
  //         expect(access[1]).to.be.bignumber.equal(executeDelay); // currentDelay
  //         expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
  //         expect(access[3]).to.be.bignumber.equal('0'); // effect
  //       });

  //       it('to a user that is already in the role', async function () {
  //         expect(await this.manager.hasRole(this.roles.SOME.id, member).then(formatAccess)).to.be.deep.equal([
  //           true,
  //           '0',
  //         ]);
  //         await this.manager.grantRole(this.roles.SOME.id, member, 0, { from: manager });
  //         expect(await this.manager.hasRole(this.roles.SOME.id, member).then(formatAccess)).to.be.deep.equal([
  //           true,
  //           '0',
  //         ]);
  //       });

  //       it('to a user that is scheduled for joining the role', async function () {
  //         await this.manager.$_grantRole(this.roles.SOME.id, user, 10, 0); // grant delay 10
  //         expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([
  //           false,
  //           '0',
  //         ]);
  //         await this.manager.grantRole(this.roles.SOME.id, user, 0, { from: manager });
  //         expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([
  //           false,
  //           '0',
  //         ]);
  //       });

  //       it('grant role is restricted', async function () {
  //         await expectRevertCustomError(
  //           this.manager.grantRole(this.roles.SOME.id, user, 0, { from: other }),
  //           'AccessManagerUnauthorizedAccount',
  //           [other, this.roles.SOME_ADMIN.id],
  //         );
  //       });
  //     });

  //     describe('with a grant delay', function () {
  //       beforeEach(async function () {
  //         await this.manager.$_setGrantDelay(this.roles.SOME.id, grantDelay);
  //         await time.increase(MINSETBACK);
  //       });

  //       it('granted role is not active immediately', async function () {
  //         const { receipt } = await this.manager.grantRole(this.roles.SOME.id, user, 0, { from: manager });
  //         const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
  //         expectEvent(receipt, 'RoleGranted', {
  //           roleId: this.roles.SOME.id,
  //           account: user,
  //           since: timestamp.add(grantDelay),
  //           delay: '0',
  //           newMember: true,
  //         });

  //         expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([
  //           false,
  //           '0',
  //         ]);

  //         const access = await this.manager.getAccess(this.roles.SOME.id, user);
  //         expect(access[0]).to.be.bignumber.equal(timestamp.add(grantDelay)); // inRoleSince
  //         expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
  //         expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
  //         expect(access[3]).to.be.bignumber.equal('0'); // effect
  //       });

  //       it('granted role is active after the delay', async function () {
  //         const { receipt } = await this.manager.grantRole(this.roles.SOME.id, user, 0, { from: manager });
  //         const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
  //         expectEvent(receipt, 'RoleGranted', {
  //           roleId: this.roles.SOME.id,
  //           account: user,
  //           since: timestamp.add(grantDelay),
  //           delay: '0',
  //           newMember: true,
  //         });

  //         await time.increase(grantDelay);

  //         expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([true, '0']);

  //         const access = await this.manager.getAccess(this.roles.SOME.id, user);
  //         expect(access[0]).to.be.bignumber.equal(timestamp.add(grantDelay)); // inRoleSince
  //         expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
  //         expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
  //         expect(access[3]).to.be.bignumber.equal('0'); // effect
  //       });
  //     });

  //     it('cannot grant public role', async function () {
  //       await expectRevertCustomError(
  //         this.manager.$_grantRole(this.roles.PUBLIC.id, other, 0, executeDelay, { from: manager }),
  //         'AccessManagerLockedRole',
  //         [this.roles.PUBLIC.id],
  //       );
  //     });
  //   });

  //   describe('revoke role', function () {
  //     it('from a user that is already in the role', async function () {
  //       expect(await this.manager.hasRole(this.roles.SOME.id, member).then(formatAccess)).to.be.deep.equal([true, '0']);

  //       const { receipt } = await this.manager.revokeRole(this.roles.SOME.id, member, { from: manager });
  //       expectEvent(receipt, 'RoleRevoked', { roleId: this.roles.SOME.id, account: member });

  //       expect(await this.manager.hasRole(this.roles.SOME.id, member).then(formatAccess)).to.be.deep.equal([
  //         false,
  //         '0',
  //       ]);

  //       const access = await this.manager.getAccess(this.roles.SOME.id, user);
  //       expect(access[0]).to.be.bignumber.equal('0'); // inRoleSince
  //       expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
  //       expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
  //       expect(access[3]).to.be.bignumber.equal('0'); // effect
  //     });

  //     it('from a user that is scheduled for joining the role', async function () {
  //       await this.manager.$_grantRole(this.roles.SOME.id, user, 10, 0); // grant delay 10

  //       expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([false, '0']);

  //       const { receipt } = await this.manager.revokeRole(this.roles.SOME.id, user, { from: manager });
  //       expectEvent(receipt, 'RoleRevoked', { roleId: this.roles.SOME.id, account: user });

  //       expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([false, '0']);

  //       const access = await this.manager.getAccess(this.roles.SOME.id, user);
  //       expect(access[0]).to.be.bignumber.equal('0'); // inRoleSince
  //       expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
  //       expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
  //       expect(access[3]).to.be.bignumber.equal('0'); // effect
  //     });

  //     it('from a user that is not in the role', async function () {
  //       expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([false, '0']);
  //       await this.manager.revokeRole(this.roles.SOME.id, user, { from: manager });
  //       expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([false, '0']);
  //     });

  //     it('revoke role is restricted', async function () {
  //       await expectRevertCustomError(
  //         this.manager.revokeRole(this.roles.SOME.id, member, { from: other }),
  //         'AccessManagerUnauthorizedAccount',
  //         [other, this.roles.SOME_ADMIN.id],
  //       );
  //     });
  //   });

  //   describe('renounce role', function () {
  //     it('for a user that is already in the role', async function () {
  //       expect(await this.manager.hasRole(this.roles.SOME.id, member).then(formatAccess)).to.be.deep.equal([true, '0']);

  //       const { receipt } = await this.manager.renounceRole(this.roles.SOME.id, member, { from: member });
  //       expectEvent(receipt, 'RoleRevoked', { roleId: this.roles.SOME.id, account: member });

  //       expect(await this.manager.hasRole(this.roles.SOME.id, member).then(formatAccess)).to.be.deep.equal([
  //         false,
  //         '0',
  //       ]);

  //       const access = await this.manager.getAccess(this.roles.SOME.id, member);
  //       expect(access[0]).to.be.bignumber.equal('0'); // inRoleSince
  //       expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
  //       expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
  //       expect(access[3]).to.be.bignumber.equal('0'); // effect
  //     });

  //     it('for a user that is schedule for joining the role', async function () {
  //       await this.manager.$_grantRole(this.roles.SOME.id, user, 10, 0); // grant delay 10

  //       expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([false, '0']);

  //       const { receipt } = await this.manager.renounceRole(this.roles.SOME.id, user, { from: user });
  //       expectEvent(receipt, 'RoleRevoked', { roleId: this.roles.SOME.id, account: user });

  //       expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([false, '0']);

  //       const access = await this.manager.getAccess(this.roles.SOME.id, user);
  //       expect(access[0]).to.be.bignumber.equal('0'); // inRoleSince
  //       expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
  //       expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
  //       expect(access[3]).to.be.bignumber.equal('0'); // effect
  //     });

  //     it('for a user that is not in the role', async function () {
  //       await this.manager.renounceRole(this.roles.SOME.id, user, { from: user });
  //     });

  //     it('bad user confirmation', async function () {
  //       await expectRevertCustomError(
  //         this.manager.renounceRole(this.roles.SOME.id, member, { from: user }),
  //         'AccessManagerBadConfirmation',
  //         [],
  //       );
  //     });
  //   });

  //   describe('change role admin', function () {
  //     it("admin can set any role's admin", async function () {
  //       expect(await this.manager.getRoleAdmin(this.roles.SOME.id)).to.be.bignumber.equal(this.roles.SOME_ADMIN.id);

  //       const { receipt } = await this.manager.setRoleAdmin(this.roles.SOME.id, this.roles.ADMIN.id, { from: admin });
  //       expectEvent(receipt, 'RoleAdminChanged', { roleId: this.roles.SOME.id, admin: this.roles.ADMIN.id });

  //       expect(await this.manager.getRoleAdmin(this.roles.SOME.id)).to.be.bignumber.equal(this.roles.ADMIN.id);
  //     });

  //     it("setting a role's admin is restricted", async function () {
  //       await expectRevertCustomError(
  //         this.manager.setRoleAdmin(this.roles.SOME.id, this.roles.SOME.id, { from: manager }),
  //         'AccessManagerUnauthorizedAccount',
  //         [manager, this.roles.ADMIN.id],
  //       );
  //     });
  //   });

  //   describe('change role guardian', function () {
  //     it("admin can set any role's admin", async function () {
  //       expect(await this.manager.getRoleGuardian(this.roles.SOME.id)).to.be.bignumber.equal(
  //         this.roles.SOME_GUARDIAN.id,
  //       );

  //       const { receipt } = await this.manager.setRoleGuardian(this.roles.SOME.id, this.roles.ADMIN.id, {
  //         from: admin,
  //       });
  //       expectEvent(receipt, 'RoleGuardianChanged', { roleId: this.roles.SOME.id, guardian: this.roles.ADMIN.id });

  //       expect(await this.manager.getRoleGuardian(this.roles.SOME.id)).to.be.bignumber.equal(this.roles.ADMIN.id);
  //     });

  //     it("setting a role's admin is restricted", async function () {
  //       await expectRevertCustomError(
  //         this.manager.setRoleGuardian(this.roles.SOME.id, this.roles.SOME.id, { from: other }),
  //         'AccessManagerUnauthorizedAccount',
  //         [other, this.roles.ADMIN.id],
  //       );
  //     });
  //   });

  //   describe('change execution delay', function () {
  //     it('increasing the delay has immediate effect', async function () {
  //       const oldDelay = web3.utils.toBN(10);
  //       const newDelay = web3.utils.toBN(100);

  //       // role is already granted (with no delay) in the initial setup. this update takes time.
  //       await this.manager.$_grantRole(this.roles.SOME.id, member, 0, oldDelay);

  //       const accessBefore = await this.manager.getAccess(this.roles.SOME.id, member);
  //       expect(accessBefore[1]).to.be.bignumber.equal(oldDelay); // currentDelay
  //       expect(accessBefore[2]).to.be.bignumber.equal('0'); // pendingDelay
  //       expect(accessBefore[3]).to.be.bignumber.equal('0'); // effect

  //       const { receipt } = await this.manager.grantRole(this.roles.SOME.id, member, newDelay, {
  //         from: manager,
  //       });
  //       const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

  //       expectEvent(receipt, 'RoleGranted', {
  //         roleId: this.roles.SOME.id,
  //         account: member,
  //         since: timestamp,
  //         delay: newDelay,
  //         newMember: false,
  //       });

  //       // immediate effect
  //       const accessAfter = await this.manager.getAccess(this.roles.SOME.id, member);
  //       expect(accessAfter[1]).to.be.bignumber.equal(newDelay); // currentDelay
  //       expect(accessAfter[2]).to.be.bignumber.equal('0'); // pendingDelay
  //       expect(accessAfter[3]).to.be.bignumber.equal('0'); // effect
  //     });

  //     it('decreasing the delay takes time', async function () {
  //       const oldDelay = web3.utils.toBN(100);
  //       const newDelay = web3.utils.toBN(10);

  //       // role is already granted (with no delay) in the initial setup. this update takes time.
  //       await this.manager.$_grantRole(this.roles.SOME.id, member, 0, oldDelay);

  //       const accessBefore = await this.manager.getAccess(this.roles.SOME.id, member);
  //       expect(accessBefore[1]).to.be.bignumber.equal(oldDelay); // currentDelay
  //       expect(accessBefore[2]).to.be.bignumber.equal('0'); // pendingDelay
  //       expect(accessBefore[3]).to.be.bignumber.equal('0'); // effect

  //       const { receipt } = await this.manager.grantRole(this.roles.SOME.id, member, newDelay, {
  //         from: manager,
  //       });
  //       const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
  //       const setback = oldDelay.sub(newDelay);

  //       expectEvent(receipt, 'RoleGranted', {
  //         roleId: this.roles.SOME.id,
  //         account: member,
  //         since: timestamp.add(setback),
  //         delay: newDelay,
  //         newMember: false,
  //       });

  //       // no immediate effect
  //       const accessAfter = await this.manager.getAccess(this.roles.SOME.id, member);
  //       expect(accessAfter[1]).to.be.bignumber.equal(oldDelay); // currentDelay
  //       expect(accessAfter[2]).to.be.bignumber.equal(newDelay); // pendingDelay
  //       expect(accessAfter[3]).to.be.bignumber.equal(timestamp.add(setback)); // effect

  //       // delayed effect
  //       await time.increase(setback);
  //       const accessAfterSetback = await this.manager.getAccess(this.roles.SOME.id, member);
  //       expect(accessAfterSetback[1]).to.be.bignumber.equal(newDelay); // currentDelay
  //       expect(accessAfterSetback[2]).to.be.bignumber.equal('0'); // pendingDelay
  //       expect(accessAfterSetback[3]).to.be.bignumber.equal('0'); // effect
  //     });

  //     it('can set a user execution delay during the grant delay', async function () {
  //       await this.manager.$_grantRole(this.roles.SOME.id, other, 10, 0);
  //       // here: "other" is pending to get the role, but doesn't yet have it.

  //       const { receipt } = await this.manager.grantRole(this.roles.SOME.id, other, executeDelay, { from: manager });
  //       const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

  //       // increasing the execution delay from 0 to executeDelay is immediate
  //       expectEvent(receipt, 'RoleGranted', {
  //         roleId: this.roles.SOME.id,
  //         account: other,
  //         since: timestamp,
  //         delay: executeDelay,
  //         newMember: false,
  //       });
  //     });
  //   });

  // describe('with AccessManaged target contract', function () {
  //   beforeEach('deploy target contract', async function () {
  //     this.target = await AccessManagedTarget.new(this.manager.address);
  //     // helpers for indirect calls
  //     this.callData = selector('fnRestricted()');
  //     this.call = [this.target.address, this.callData];
  //     this.opId = web3.utils.keccak256(
  //       web3.eth.abi.encodeParameters(['address', 'address', 'bytes'], [user, ...this.call]),
  //     );
  //     this.direct = (opts = {}) => this.target.fnRestricted({ from: user, ...opts });
  //     this.schedule = (opts = {}) => this.manager.schedule(...this.call, 0, { from: user, ...opts });
  //     this.execute = (opts = {}) => this.manager.execute(...this.call, { from: user, ...opts });
  //     this.cancel = (opts = {}) => this.manager.cancel(user, ...this.call, { from: user, ...opts });
  //   });

  //   describe('Change function permissions', function () {
  //     const sigs = ['someFunction()', 'someOtherFunction(uint256)', 'oneMoreFunction(address,uint8)'].map(selector);

  //     it('admin can set function role', async function () {
  //       for (const sig of sigs) {
  //         expect(await this.manager.getTargetFunctionRole(this.target.address, sig)).to.be.bignumber.equal(
  //           this.roles.ADMIN.id,
  //         );
  //       }

  //       const { receipt: receipt1 } = await this.manager.setTargetFunctionRole(
  //         this.target.address,
  //         sigs,
  //         this.roles.SOME.id,
  //         {
  //           from: admin,
  //         },
  //       );

  //       for (const sig of sigs) {
  //         expectEvent(receipt1, 'TargetFunctionRoleUpdated', {
  //           target: this.target.address,
  //           selector: sig,
  //           roleId: this.roles.SOME.id,
  //         });
  //         expect(await this.manager.getTargetFunctionRole(this.target.address, sig)).to.be.bignumber.equal(
  //           this.roles.SOME.id,
  //         );
  //       }

  //       const { receipt: receipt2 } = await this.manager.setTargetFunctionRole(
  //         this.target.address,
  //         [sigs[1]],
  //         this.roles.SOME_ADMIN.id,
  //         {
  //           from: admin,
  //         },
  //       );
  //       expectEvent(receipt2, 'TargetFunctionRoleUpdated', {
  //         target: this.target.address,
  //         selector: sigs[1],
  //         roleId: this.roles.SOME_ADMIN.id,
  //       });

  //       for (const sig of sigs) {
  //         expect(await this.manager.getTargetFunctionRole(this.target.address, sig)).to.be.bignumber.equal(
  //           sig == sigs[1] ? this.roles.SOME_ADMIN.id : this.roles.SOME.id,
  //         );
  //       }
  //     });

  //     it('non-admin cannot set function role', async function () {
  //       await expectRevertCustomError(
  //         this.manager.setTargetFunctionRole(this.target.address, sigs, this.roles.SOME.id, { from: other }),
  //         'AccessManagerUnauthorizedAccount',
  //         [other, this.roles.ADMIN.id],
  //       );
  //     });
  //   });

  //   // WIP
  //   describe('Calling restricted & unrestricted functions', function () {
  //     for (const [callerRoles, currentRole, closed, delay] of product(
  //       [[], [BASE_ROLES.SOME]], // callerRoles
  //       [{}, BASE_ROLES.ADMIN, BASE_ROLES.SOME, BASE_ROLES.PUBLIC], // currentRoles
  //       [false, true], // closed
  //       [null, executeDelay], // delay,
  //     )) {
  //       const isCaller = callerRoles.some(({ id }) => id == currentRole.id);

  //       // can we call with a delay ?
  //       const indirectSuccess = (currentRole.id == BASE_ROLES.PUBLIC.id || isCaller) && !closed;

  //       // can we call without a delay ?
  //       const directSuccess = (currentRole.id == BASE_ROLES.PUBLIC.id || (isCaller && !delay)) && !closed;

  //       const description = [
  //         'Caller in roles',
  //         '[' + callerRoles.map(({ name }) => name).join(', ') + ']',
  //         delay ? 'with a delay' : 'without a delay',
  //         '+',
  //         'functions open to role',
  //         '[' + (currentRole.name ?? '') + ']',
  //         closed ? `(closed)` : '',
  //       ].join(' ');

  //       describe(description, function () {
  //         beforeEach(async function () {
  //           // setup
  //           await Promise.all([
  //             this.manager.$_setTargetClosed(this.target.address, closed),
  //             currentRole.id &&
  //               this.manager.$_setTargetFunctionRole(this.target.address, selector('fnRestricted()'), currentRole.id),
  //             currentRole.id &&
  //               this.manager.$_setTargetFunctionRole(this.target.address, selector('fnUnrestricted()'), currentRole.id),
  //             ...callerRoles
  //               .filter(({ id }) => id != this.roles.PUBLIC.id)
  //               .map(({ id }) => this.manager.$_grantRole(id, user, 0, delay ?? 0)),
  //           ]);

  //           // post setup checks
  //           expect(await this.manager.isTargetClosed(this.target.address)).to.be.equal(closed);

  //           if (currentRole.id) {
  //             expect(
  //               await this.manager.getTargetFunctionRole(this.target.address, selector('fnRestricted()')),
  //             ).to.be.bignumber.equal(currentRole.id);
  //             expect(
  //               await this.manager.getTargetFunctionRole(this.target.address, selector('fnUnrestricted()')),
  //             ).to.be.bignumber.equal(currentRole.id);
  //           }

  //           for (const role of callerRoles) {
  //             const roleId = role.id;
  //             const access = await this.manager.getAccess(roleId, user);
  //             expect(access[0]).to.be.bignumber.gt('0'); // inRoleSince
  //             expect(access[1]).to.be.bignumber.eq(roleId == this.roles.PUBLIC.id ? '0' : String(delay ?? 0)); // currentDelay
  //             expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
  //             expect(access[3]).to.be.bignumber.equal('0'); // effect
  //           }
  //         });

  //         it('canCall', async function () {
  //           const result = await this.manager.canCall(user, this.target.address, selector('fnRestricted()'));
  //           expect(result[0]).to.be.equal(directSuccess);
  //           expect(result[1]).to.be.bignumber.equal(!directSuccess && indirectSuccess ? delay ?? '0' : '0');
  //         });

  //         it('Calling a non restricted function never revert', async function () {
  //           expectEvent(await this.target.fnUnrestricted({ from: user }), 'CalledUnrestricted', {
  //             caller: user,
  //           });
  //         });

  //         it(`Calling a restricted function directly should ${
  //           directSuccess ? 'succeed' : 'revert'
  //         }`, async function () {
  //           const promise = this.direct();

  //           if (directSuccess) {
  //             expectEvent(await promise, 'CalledRestricted', { caller: user });
  //           } else if (indirectSuccess) {
  //             await expectRevertCustomError(promise, 'AccessManagerNotScheduled', [this.opId]);
  //           } else {
  //             await expectRevertCustomError(promise, 'AccessManagedUnauthorized', [user]);
  //           }
  //         });

  //         it('Calling indirectly: only execute', async function () {
  //           // execute without schedule
  //           if (directSuccess) {
  //             const nonceBefore = await this.manager.getNonce(this.opId);
  //             const { receipt, tx } = await this.execute();

  //             expectEvent.notEmitted(receipt, 'OperationExecuted', { operationId: this.opId });
  //             await expectEvent.inTransaction(tx, this.target, 'CalledRestricted', { caller: this.manager.address });

  //             // nonce is not modified
  //             expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore);
  //           } else if (indirectSuccess) {
  //             await expectRevertCustomError(this.execute(), 'AccessManagerNotScheduled', [this.opId]);
  //           } else {
  //             await expectRevertCustomError(this.execute(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
  //           }
  //         });

  //         it('Calling indirectly: schedule and execute', async function () {
  //           if (directSuccess || indirectSuccess) {
  //             const nonceBefore = await this.manager.getNonce(this.opId);
  //             const { receipt } = await this.schedule();
  //             const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

  //             expectEvent(receipt, 'OperationScheduled', {
  //               operationId: this.opId,
  //               caller: user,
  //               target: this.call[0],
  //               data: this.call[1],
  //             });

  //             // if can call directly, delay should be 0. Otherwise, the delay should be applied
  //             expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(
  //               timestamp.add(directSuccess ? web3.utils.toBN(0) : delay),
  //             );

  //             // nonce is incremented
  //             expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));

  //             // execute without wait
  //             if (directSuccess) {
  //               const { receipt, tx } = await this.execute();

  //               await expectEvent.inTransaction(tx, this.target, 'CalledRestricted', { caller: this.manager.address });
  //               if (delay && currentRole.id !== this.roles.PUBLIC.id) {
  //                 expectEvent(receipt, 'OperationExecuted', { operationId: this.opId });
  //                 expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal('0');
  //               }

  //               // nonce is not modified by execute
  //               expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));
  //             } else if (indirectSuccess) {
  //               await expectRevertCustomError(this.execute(), 'AccessManagerNotReady', [this.opId]);
  //             } else {
  //               await expectRevertCustomError(this.execute(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
  //             }
  //           } else {
  //             await expectRevertCustomError(this.schedule(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
  //           }
  //         });

  //         it('Calling indirectly: schedule wait and execute', async function () {
  //           if (directSuccess || indirectSuccess) {
  //             const nonceBefore = await this.manager.getNonce(this.opId);
  //             const { receipt } = await this.schedule();
  //             const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

  //             expectEvent(receipt, 'OperationScheduled', {
  //               operationId: this.opId,
  //               caller: user,
  //               target: this.call[0],
  //               data: this.call[1],
  //             });

  //             // if can call directly, delay should be 0. Otherwise, the delay should be applied
  //             expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(
  //               timestamp.add(directSuccess ? web3.utils.toBN(0) : delay),
  //             );

  //             // nonce is incremented
  //             expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));

  //             // wait
  //             await time.increase(delay ?? 0);

  //             // execute without wait
  //             if (directSuccess || indirectSuccess) {
  //               const { receipt, tx } = await this.execute();

  //               await expectEvent.inTransaction(tx, this.target, 'CalledRestricted', { caller: this.manager.address });
  //               if (delay && currentRole.id !== this.roles.PUBLIC.id) {
  //                 expectEvent(receipt, 'OperationExecuted', { operationId: this.opId });
  //                 expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal('0');
  //               }

  //               // nonce is not modified by execute
  //               expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));
  //             } else {
  //               await expectRevertCustomError(this.execute(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
  //             }
  //           } else {
  //             await expectRevertCustomError(this.schedule(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
  //           }
  //         });

  //         it('Calling directly: schedule and call', async function () {
  //           if (directSuccess || indirectSuccess) {
  //             const nonceBefore = await this.manager.getNonce(this.opId);
  //             const { receipt } = await this.schedule();
  //             const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

  //             expectEvent(receipt, 'OperationScheduled', {
  //               operationId: this.opId,
  //               caller: user,
  //               target: this.call[0],
  //               data: this.call[1],
  //             });

  //             // if can call directly, delay should be 0. Otherwise, the delay should be applied
  //             const schedule = timestamp.add(directSuccess ? web3.utils.toBN(0) : delay);
  //             expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(schedule);

  //             // nonce is incremented
  //             expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));

  //             // execute without wait
  //             const promise = this.direct();
  //             if (directSuccess) {
  //               expectEvent(await promise, 'CalledRestricted', { caller: user });

  //               // schedule is not reset
  //               expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(schedule);

  //               // nonce is not modified by execute
  //               expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));
  //             } else if (indirectSuccess) {
  //               await expectRevertCustomError(promise, 'AccessManagerNotReady', [this.opId]);
  //             } else {
  //               await expectRevertCustomError(promise, 'AccessManagerUnauthorizedCall', [user, ...this.call]);
  //             }
  //           } else {
  //             await expectRevertCustomError(this.schedule(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
  //           }
  //         });

  //         it('Calling directly: schedule wait and call', async function () {
  //           if (directSuccess || indirectSuccess) {
  //             const nonceBefore = await this.manager.getNonce(this.opId);
  //             const { receipt } = await this.schedule();
  //             const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

  //             expectEvent(receipt, 'OperationScheduled', {
  //               operationId: this.opId,
  //               caller: user,
  //               target: this.call[0],
  //               data: this.call[1],
  //             });

  //             // if can call directly, delay should be 0. Otherwise, the delay should be applied
  //             const schedule = timestamp.add(directSuccess ? web3.utils.toBN(0) : delay);
  //             expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(schedule);

  //             // nonce is incremented
  //             expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));

  //             // wait
  //             await time.increase(delay ?? 0);

  //             // execute without wait
  //             const promise = await this.direct();
  //             if (directSuccess) {
  //               expectEvent(await promise, 'CalledRestricted', { caller: user });

  //               // schedule is not reset
  //               expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(schedule);

  //               // nonce is not modified by execute
  //               expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));
  //             } else if (indirectSuccess) {
  //               const receipt = await promise;

  //               expectEvent(receipt, 'CalledRestricted', { caller: user });
  //               await expectEvent.inTransaction(receipt.tx, this.manager, 'OperationExecuted', {
  //                 operationId: this.opId,
  //               });

  //               // schedule is reset
  //               expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal('0');

  //               // nonce is not modified by execute
  //               expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));
  //             } else {
  //               await expectRevertCustomError(this.direct(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
  //             }
  //           } else {
  //             await expectRevertCustomError(this.schedule(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
  //           }
  //         });

  //         it('Scheduling for later than needed'); // TODO
  //       });
  //     }
  //   });

  //   describe('Indirect execution corner-cases', async function () {
  //     beforeEach(async function () {
  //       await this.manager.$_setTargetFunctionRole(this.target.address, this.callData, this.roles.SOME.id);
  //       await this.manager.$_grantRole(this.roles.SOME.id, user, 0, executeDelay);
  //     });

  //     it('Checking canCall when caller is the manager depend on the _executionId', async function () {
  //       const result = await this.manager.canCall(this.manager.address, this.target.address, '0x00000000');
  //       expect(result[0]).to.be.false;
  //       expect(result[1]).to.be.bignumber.equal('0');
  //     });

  //     it('Cannot execute earlier', async function () {
  //       const { receipt } = await this.schedule();
  //       const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

  //       expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(timestamp.add(executeDelay));

  //       // too early
  //       await helpers.time.setNextBlockTimestamp(timestamp.add(executeDelay).subn(1));
  //       await expectRevertCustomError(this.execute(), 'AccessManagerNotReady', [this.opId]);

  //       // the revert happened one second before the execution delay expired
  //       expect(await time.latest()).to.be.bignumber.equal(timestamp.add(executeDelay).subn(1));

  //       // ok
  //       await helpers.time.setNextBlockTimestamp(timestamp.add(executeDelay));
  //       await this.execute();

  //       // the success happened when the delay was reached (earliest possible)
  //       expect(await time.latest()).to.be.bignumber.equal(timestamp.add(executeDelay));
  //     });

  //     it('Cannot schedule an already scheduled operation', async function () {
  //       const { receipt } = await this.schedule();
  //       expectEvent(receipt, 'OperationScheduled', {
  //         operationId: this.opId,
  //         caller: user,
  //         target: this.call[0],
  //         data: this.call[1],
  //       });

  //       await expectRevertCustomError(this.schedule(), 'AccessManagerAlreadyScheduled', [this.opId]);
  //     });

  //     it('Cannot cancel an operation that is not scheduled', async function () {
  //       await expectRevertCustomError(this.cancel(), 'AccessManagerNotScheduled', [this.opId]);
  //     });

  //     it('Cannot cancel an operation that is already executed', async function () {
  //       await this.schedule();
  //       await time.increase(executeDelay);
  //       await this.execute();

  //       await expectRevertCustomError(this.cancel(), 'AccessManagerNotScheduled', [this.opId]);
  //     });

  //     it('Scheduler can cancel', async function () {
  //       const scheduler = user;
  //       await this.schedule({ from: scheduler });

  //       expect(await this.manager.getSchedule(this.opId)).to.not.be.bignumber.equal('0');

  //       expectEvent(await this.cancel({ from: scheduler }), 'OperationCanceled', { operationId: this.opId });

  //       expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal('0');
  //     });

  //     it('Guardian can cancel', async function () {
  //       await this.schedule();

  //       expect(await this.manager.getSchedule(this.opId)).to.not.be.bignumber.equal('0');

  //       expectEvent(await this.cancel({ from: guardian }), 'OperationCanceled', { operationId: this.opId });

  //       expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal('0');
  //     });

  //     it('Cancel is restricted', async function () {
  //       await this.schedule();

  //       expect(await this.manager.getSchedule(this.opId)).to.not.be.bignumber.equal('0');

  //       await expectRevertCustomError(this.cancel({ from: other }), 'AccessManagerUnauthorizedCancel', [
  //         other,
  //         user,
  //         ...this.call,
  //       ]);

  //       expect(await this.manager.getSchedule(this.opId)).to.not.be.bignumber.equal('0');
  //     });

  //     it('Can re-schedule after execution', async function () {
  //       await this.schedule();
  //       await time.increase(executeDelay);
  //       await this.execute();

  //       // reschedule
  //       const { receipt } = await this.schedule();
  //       expectEvent(receipt, 'OperationScheduled', {
  //         operationId: this.opId,
  //         caller: user,
  //         target: this.call[0],
  //         data: this.call[1],
  //       });
  //     });

  //     it('Can re-schedule after cancel', async function () {
  //       await this.schedule();
  //       await this.cancel();

  //       // reschedule
  //       const { receipt } = await this.schedule();
  //       expectEvent(receipt, 'OperationScheduled', {
  //         operationId: this.opId,
  //         caller: user,
  //         target: this.call[0],
  //         data: this.call[1],
  //       });
  //     });
  //   });
  // });

  // describe('with Ownable target contract', function () {
  //   const roleId = web3.utils.toBN(1);

  //   beforeEach(async function () {
  //     this.ownable = await Ownable.new(this.manager.address);

  //     // add user to role
  //     await this.manager.$_grantRole(roleId, user, 0, 0);
  //   });

  //   it('initial state', async function () {
  //     expect(await this.ownable.owner()).to.be.equal(this.manager.address);
  //   });

  //   describe('Contract is closed', function () {
  //     beforeEach(async function () {
  //       await this.manager.$_setTargetClosed(this.ownable.address, true);
  //     });

  //     it('directly call: reverts', async function () {
  //       await expectRevertCustomError(this.ownable.$_checkOwner({ from: user }), 'OwnableUnauthorizedAccount', [user]);
  //     });

  //     it('relayed call (with role): reverts', async function () {
  //       await expectRevertCustomError(
  //         this.manager.execute(this.ownable.address, selector('$_checkOwner()'), { from: user }),
  //         'AccessManagerUnauthorizedCall',
  //         [user, this.ownable.address, selector('$_checkOwner()')],
  //       );
  //     });

  //     it('relayed call (without role): reverts', async function () {
  //       await expectRevertCustomError(
  //         this.manager.execute(this.ownable.address, selector('$_checkOwner()'), { from: other }),
  //         'AccessManagerUnauthorizedCall',
  //         [other, this.ownable.address, selector('$_checkOwner()')],
  //       );
  //     });
  //   });

  //   describe('Contract is managed', function () {
  //     describe('function is open to specific role', function () {
  //       beforeEach(async function () {
  //         await this.manager.$_setTargetFunctionRole(this.ownable.address, selector('$_checkOwner()'), roleId);
  //       });

  //       it('directly call: reverts', async function () {
  //         await expectRevertCustomError(this.ownable.$_checkOwner({ from: user }), 'OwnableUnauthorizedAccount', [
  //           user,
  //         ]);
  //       });

  //       it('relayed call (with role): success', async function () {
  //         await this.manager.execute(this.ownable.address, selector('$_checkOwner()'), { from: user });
  //       });

  //       it('relayed call (without role): reverts', async function () {
  //         await expectRevertCustomError(
  //           this.manager.execute(this.ownable.address, selector('$_checkOwner()'), { from: other }),
  //           'AccessManagerUnauthorizedCall',
  //           [other, this.ownable.address, selector('$_checkOwner()')],
  //         );
  //       });
  //     });

  //     describe('function is open to public role', function () {
  //       beforeEach(async function () {
  //         await this.manager.$_setTargetFunctionRole(
  //           this.ownable.address,
  //           selector('$_checkOwner()'),
  //           this.roles.PUBLIC.id,
  //         );
  //       });

  //       it('directly call: reverts', async function () {
  //         await expectRevertCustomError(this.ownable.$_checkOwner({ from: user }), 'OwnableUnauthorizedAccount', [
  //           user,
  //         ]);
  //       });

  //       it('relayed call (with role): success', async function () {
  //         await this.manager.execute(this.ownable.address, selector('$_checkOwner()'), { from: user });
  //       });

  //       it('relayed call (without role): success', async function () {
  //         await this.manager.execute(this.ownable.address, selector('$_checkOwner()'), { from: other });
  //       });
  //     });
  //   });
  // });

  // describe('authority update', function () {
  //   beforeEach(async function () {
  //     this.newManager = await AccessManager.new(admin);
  //     this.target = await AccessManagedTarget.new(this.manager.address);
  //   });

  //   it('admin can change authority', async function () {
  //     expect(await this.target.authority()).to.be.equal(this.manager.address);

  //     const { tx } = await this.manager.updateAuthority(this.target.address, this.newManager.address, { from: admin });
  //     await expectEvent.inTransaction(tx, this.target, 'AuthorityUpdated', { authority: this.newManager.address });

  //     expect(await this.target.authority()).to.be.equal(this.newManager.address);
  //   });

  //   it('cannot set an address without code as the authority', async function () {
  //     await expectRevertCustomError(
  //       this.manager.updateAuthority(this.target.address, user, { from: admin }),
  //       'AccessManagedInvalidAuthority',
  //       [user],
  //     );
  //   });

  //   it('updateAuthority is restricted on manager', async function () {
  //     await expectRevertCustomError(
  //       this.manager.updateAuthority(this.target.address, this.newManager.address, { from: other }),
  //       'AccessManagerUnauthorizedAccount',
  //       [other, this.roles.ADMIN.id],
  //     );
  //   });

  //   it('setAuthority is restricted on AccessManaged', async function () {
  //     await expectRevertCustomError(
  //       this.target.setAuthority(this.newManager.address, { from: admin }),
  //       'AccessManagedUnauthorized',
  //       [admin],
  //     );
  //   });
  // });

  // TODO:
  // - check opening/closing a contract
  // - check updating the contract delay
  // - check the delay applies to admin function
  describe.skip('contract modes', function () {});
});
