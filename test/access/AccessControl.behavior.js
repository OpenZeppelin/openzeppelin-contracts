const { ethers } = require('hardhat');
const { expect } = require('chai');

const time = require('../helpers/time');

const { shouldSupportInterfaces } = require('../utils/introspection/SupportsInterface.behavior');

const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
const ROLE = ethers.id('ROLE');
const OTHER_ROLE = ethers.id('OTHER_ROLE');

function shouldBehaveLikeAccessControl() {
  beforeEach(async function () {
    [this.authorized, this.other, this.otherAdmin] = this.accounts;
  });

  shouldSupportInterfaces(['AccessControl']);

  describe('default admin', function () {
    it('deployer has default admin role', async function () {
      expect(await this.mock.hasRole(DEFAULT_ADMIN_ROLE, this.defaultAdmin)).to.be.true;
    });

    it("other role's admin is the default admin role", async function () {
      expect(await this.mock.getRoleAdmin(ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
    });

    it("default admin role's admin is itself", async function () {
      expect(await this.mock.getRoleAdmin(DEFAULT_ADMIN_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
    });
  });

  describe('granting', function () {
    beforeEach(async function () {
      await this.mock.connect(this.defaultAdmin).grantRole(ROLE, this.authorized);
    });

    it('non-admin cannot grant role to other accounts', async function () {
      await expect(this.mock.connect(this.other).grantRole(ROLE, this.authorized))
        .to.be.revertedWithCustomError(this.mock, 'AccessControlUnauthorizedAccount')
        .withArgs(this.other, DEFAULT_ADMIN_ROLE);
    });

    it('accounts can be granted a role multiple times', async function () {
      await this.mock.connect(this.defaultAdmin).grantRole(ROLE, this.authorized);
      await expect(this.mock.connect(this.defaultAdmin).grantRole(ROLE, this.authorized)).to.not.emit(
        this.mock,
        'RoleGranted',
      );
    });
  });

  describe('revoking', function () {
    it('roles that are not had can be revoked', async function () {
      expect(await this.mock.hasRole(ROLE, this.authorized)).to.be.false;

      await expect(this.mock.connect(this.defaultAdmin).revokeRole(ROLE, this.authorized)).to.not.emit(
        this.mock,
        'RoleRevoked',
      );
    });

    describe('with granted role', function () {
      beforeEach(async function () {
        await this.mock.connect(this.defaultAdmin).grantRole(ROLE, this.authorized);
      });

      it('admin can revoke role', async function () {
        await expect(this.mock.connect(this.defaultAdmin).revokeRole(ROLE, this.authorized))
          .to.emit(this.mock, 'RoleRevoked')
          .withArgs(ROLE, this.authorized, this.defaultAdmin);

        expect(await this.mock.hasRole(ROLE, this.authorized)).to.be.false;
      });

      it('non-admin cannot revoke role', async function () {
        await expect(this.mock.connect(this.other).revokeRole(ROLE, this.authorized))
          .to.be.revertedWithCustomError(this.mock, 'AccessControlUnauthorizedAccount')
          .withArgs(this.other, DEFAULT_ADMIN_ROLE);
      });

      it('a role can be revoked multiple times', async function () {
        await this.mock.connect(this.defaultAdmin).revokeRole(ROLE, this.authorized);

        await expect(this.mock.connect(this.defaultAdmin).revokeRole(ROLE, this.authorized)).to.not.emit(
          this.mock,
          'RoleRevoked',
        );
      });
    });
  });

  describe('renouncing', function () {
    it('roles that are not had can be renounced', async function () {
      await expect(this.mock.connect(this.authorized).renounceRole(ROLE, this.authorized)).to.not.emit(
        this.mock,
        'RoleRevoked',
      );
    });

    describe('with granted role', function () {
      beforeEach(async function () {
        await this.mock.connect(this.defaultAdmin).grantRole(ROLE, this.authorized);
      });

      it('bearer can renounce role', async function () {
        await expect(this.mock.connect(this.authorized).renounceRole(ROLE, this.authorized))
          .to.emit(this.mock, 'RoleRevoked')
          .withArgs(ROLE, this.authorized, this.authorized);

        expect(await this.mock.hasRole(ROLE, this.authorized)).to.be.false;
      });

      it('only the sender can renounce their roles', async function () {
        await expect(
          this.mock.connect(this.defaultAdmin).renounceRole(ROLE, this.authorized),
        ).to.be.revertedWithCustomError(this.mock, 'AccessControlBadConfirmation');
      });

      it('a role can be renounced multiple times', async function () {
        await this.mock.connect(this.authorized).renounceRole(ROLE, this.authorized);

        await expect(this.mock.connect(this.authorized).renounceRole(ROLE, this.authorized)).not.to.emit(
          this.mock,
          'RoleRevoked',
        );
      });
    });
  });

  describe('setting role admin', function () {
    beforeEach(async function () {
      await expect(this.mock.$_setRoleAdmin(ROLE, OTHER_ROLE))
        .to.emit(this.mock, 'RoleAdminChanged')
        .withArgs(ROLE, DEFAULT_ADMIN_ROLE, OTHER_ROLE);

      await this.mock.connect(this.defaultAdmin).grantRole(OTHER_ROLE, this.otherAdmin);
    });

    it("a role's admin role can be changed", async function () {
      expect(await this.mock.getRoleAdmin(ROLE)).to.equal(OTHER_ROLE);
    });

    it('the new admin can grant roles', async function () {
      await expect(this.mock.connect(this.otherAdmin).grantRole(ROLE, this.authorized))
        .to.emit(this.mock, 'RoleGranted')
        .withArgs(ROLE, this.authorized, this.otherAdmin);
    });

    it('the new admin can revoke roles', async function () {
      await this.mock.connect(this.otherAdmin).grantRole(ROLE, this.authorized);
      await expect(this.mock.connect(this.otherAdmin).revokeRole(ROLE, this.authorized))
        .to.emit(this.mock, 'RoleRevoked')
        .withArgs(ROLE, this.authorized, this.otherAdmin);
    });

    it("a role's previous admins no longer grant roles", async function () {
      await expect(this.mock.connect(this.defaultAdmin).grantRole(ROLE, this.authorized))
        .to.be.revertedWithCustomError(this.mock, 'AccessControlUnauthorizedAccount')
        .withArgs(this.defaultAdmin, OTHER_ROLE);
    });

    it("a role's previous admins no longer revoke roles", async function () {
      await expect(this.mock.connect(this.defaultAdmin).revokeRole(ROLE, this.authorized))
        .to.be.revertedWithCustomError(this.mock, 'AccessControlUnauthorizedAccount')
        .withArgs(this.defaultAdmin, OTHER_ROLE);
    });
  });

  describe('onlyRole modifier', function () {
    beforeEach(async function () {
      await this.mock.connect(this.defaultAdmin).grantRole(ROLE, this.authorized);
    });

    it('do not revert if sender has role', async function () {
      await this.mock.connect(this.authorized).$_checkRole(ROLE);
    });

    it("revert if sender doesn't have role #1", async function () {
      await expect(this.mock.connect(this.other).$_checkRole(ROLE))
        .to.be.revertedWithCustomError(this.mock, 'AccessControlUnauthorizedAccount')
        .withArgs(this.other, ROLE);
    });

    it("revert if sender doesn't have role #2", async function () {
      await expect(this.mock.connect(this.authorized).$_checkRole(OTHER_ROLE))
        .to.be.revertedWithCustomError(this.mock, 'AccessControlUnauthorizedAccount')
        .withArgs(this.authorized, OTHER_ROLE);
    });
  });

  describe('internal functions', function () {
    describe('_grantRole', function () {
      it('return true if the account does not have the role', async function () {
        await expect(this.mock.$_grantRole(ROLE, this.authorized))
          .to.emit(this.mock, 'return$_grantRole')
          .withArgs(true);
      });

      it('return false if the account has the role', async function () {
        await this.mock.$_grantRole(ROLE, this.authorized);

        await expect(this.mock.$_grantRole(ROLE, this.authorized))
          .to.emit(this.mock, 'return$_grantRole')
          .withArgs(false);
      });
    });

    describe('_revokeRole', function () {
      it('return true if the account has the role', async function () {
        await this.mock.$_grantRole(ROLE, this.authorized);

        await expect(this.mock.$_revokeRole(ROLE, this.authorized))
          .to.emit(this.mock, 'return$_revokeRole')
          .withArgs(true);
      });

      it('return false if the account does not have the role', async function () {
        await expect(this.mock.$_revokeRole(ROLE, this.authorized))
          .to.emit(this.mock, 'return$_revokeRole')
          .withArgs(false);
      });
    });
  });
}

function shouldBehaveLikeAccessControlEnumerable() {
  beforeEach(async function () {
    [this.authorized, this.other, this.otherAdmin, this.otherAuthorized] = this.accounts;
  });

  shouldSupportInterfaces(['AccessControlEnumerable']);

  describe('enumerating', function () {
    it('role bearers can be enumerated', async function () {
      await this.mock.connect(this.defaultAdmin).grantRole(ROLE, this.authorized);
      await this.mock.connect(this.defaultAdmin).grantRole(ROLE, this.other);
      await this.mock.connect(this.defaultAdmin).grantRole(ROLE, this.otherAuthorized);
      await this.mock.connect(this.defaultAdmin).revokeRole(ROLE, this.other);

      const expectedMembers = [this.authorized.address, this.otherAuthorized.address];

      const memberCount = await this.mock.getRoleMemberCount(ROLE);
      const members = [];
      for (let i = 0; i < memberCount; ++i) {
        members.push(await this.mock.getRoleMember(ROLE, i));
      }

      expect(memberCount).to.equal(expectedMembers.length);
      expect(members).to.deep.equal(expectedMembers);
      expect(await this.mock.getRoleMembers(ROLE)).to.deep.equal(expectedMembers);
    });

    it('role enumeration should be in sync after renounceRole call', async function () {
      expect(await this.mock.getRoleMemberCount(ROLE)).to.equal(0);
      await this.mock.connect(this.defaultAdmin).grantRole(ROLE, this.defaultAdmin);
      expect(await this.mock.getRoleMemberCount(ROLE)).to.equal(1);
      await this.mock.connect(this.defaultAdmin).renounceRole(ROLE, this.defaultAdmin);
      expect(await this.mock.getRoleMemberCount(ROLE)).to.equal(0);
    });
  });
}

function shouldBehaveLikeAccessControlDefaultAdminRules() {
  shouldSupportInterfaces(['AccessControlDefaultAdminRules']);

  beforeEach(async function () {
    [this.newDefaultAdmin, this.other] = this.accounts;
  });

  for (const getter of ['owner', 'defaultAdmin']) {
    describe(`${getter}()`, function () {
      it('has a default set to the initial default admin', async function () {
        const value = await this.mock[getter]();
        expect(value).to.equal(this.defaultAdmin);
        expect(await this.mock.hasRole(DEFAULT_ADMIN_ROLE, value)).to.be.true;
      });

      it('changes if the default admin changes', async function () {
        // Starts an admin transfer
        await this.mock.connect(this.defaultAdmin).beginDefaultAdminTransfer(this.newDefaultAdmin);

        // Wait for acceptance
        await time.increaseBy.timestamp(this.delay + 1n, false);
        await this.mock.connect(this.newDefaultAdmin).acceptDefaultAdminTransfer();

        const value = await this.mock[getter]();
        expect(value).to.equal(this.newDefaultAdmin);
      });
    });
  }

  describe('pendingDefaultAdmin()', function () {
    it('returns 0 if no pending default admin transfer', async function () {
      const { newAdmin, schedule } = await this.mock.pendingDefaultAdmin();
      expect(newAdmin).to.equal(ethers.ZeroAddress);
      expect(schedule).to.equal(0);
    });

    describe('when there is a scheduled default admin transfer', function () {
      beforeEach('begins admin transfer', async function () {
        await this.mock.connect(this.defaultAdmin).beginDefaultAdminTransfer(this.newDefaultAdmin);
      });

      for (const [fromSchedule, tag] of [
        [-1n, 'before'],
        [0n, 'exactly when'],
        [1n, 'after'],
      ]) {
        it(`returns pending admin and schedule ${tag} it passes if not accepted`, async function () {
          // Wait until schedule + fromSchedule
          const { schedule: firstSchedule } = await this.mock.pendingDefaultAdmin();
          await time.increaseTo.timestamp(firstSchedule + fromSchedule);

          const { newAdmin, schedule } = await this.mock.pendingDefaultAdmin();
          expect(newAdmin).to.equal(this.newDefaultAdmin);
          expect(schedule).to.equal(firstSchedule);
        });
      }

      it('returns 0 after schedule passes and the transfer was accepted', async function () {
        // Wait after schedule
        const { schedule: firstSchedule } = await this.mock.pendingDefaultAdmin();
        await time.increaseTo.timestamp(firstSchedule + 1n, false);

        // Accepts
        await this.mock.connect(this.newDefaultAdmin).acceptDefaultAdminTransfer();

        const { newAdmin, schedule } = await this.mock.pendingDefaultAdmin();
        expect(newAdmin).to.equal(ethers.ZeroAddress);
        expect(schedule).to.equal(0);
      });
    });
  });

  describe('defaultAdminDelay()', function () {
    it('returns the current delay', async function () {
      expect(await this.mock.defaultAdminDelay()).to.equal(this.delay);
    });

    describe('when there is a scheduled delay change', function () {
      const newDelay = 0x1337n; // Any change

      beforeEach('begins delay change', async function () {
        await this.mock.connect(this.defaultAdmin).changeDefaultAdminDelay(newDelay);
      });

      for (const [fromSchedule, tag, expectNew, delayTag] of [
        [-1n, 'before', false, 'old'],
        [0n, 'exactly when', false, 'old'],
        [1n, 'after', true, 'new'],
      ]) {
        it(`returns ${delayTag} delay ${tag} delay schedule passes`, async function () {
          // Wait until schedule + fromSchedule
          const { schedule } = await this.mock.pendingDefaultAdminDelay();
          await time.increaseTo.timestamp(schedule + fromSchedule);

          const currentDelay = await this.mock.defaultAdminDelay();
          expect(currentDelay).to.equal(expectNew ? newDelay : this.delay);
        });
      }
    });
  });

  describe('pendingDefaultAdminDelay()', function () {
    it('returns 0 if not set', async function () {
      const { newDelay, schedule } = await this.mock.pendingDefaultAdminDelay();
      expect(newDelay).to.equal(0);
      expect(schedule).to.equal(0);
    });

    describe('when there is a scheduled delay change', function () {
      const newDelay = 0x1337n; // Any change

      beforeEach('begins admin transfer', async function () {
        await this.mock.connect(this.defaultAdmin).changeDefaultAdminDelay(newDelay);
      });

      for (const [fromSchedule, tag, expectedDelay, delayTag, expectZeroSchedule] of [
        [-1n, 'before', newDelay, 'new'],
        [0n, 'exactly when', newDelay, 'new'],
        [1n, 'after', 0, 'zero', true],
      ]) {
        it(`returns ${delayTag} delay ${tag} delay schedule passes`, async function () {
          // Wait until schedule + fromSchedule
          const { schedule: firstSchedule } = await this.mock.pendingDefaultAdminDelay();
          await time.increaseTo.timestamp(firstSchedule + fromSchedule);

          const { newDelay, schedule } = await this.mock.pendingDefaultAdminDelay();
          expect(newDelay).to.equal(expectedDelay);
          expect(schedule).to.equal(expectZeroSchedule ? 0 : firstSchedule);
        });
      }
    });
  });

  describe('defaultAdminDelayIncreaseWait()', function () {
    it('should return 5 days (default)', async function () {
      expect(await this.mock.defaultAdminDelayIncreaseWait()).to.equal(time.duration.days(5));
    });
  });

  it('should revert if granting default admin role', async function () {
    await expect(
      this.mock.connect(this.defaultAdmin).grantRole(DEFAULT_ADMIN_ROLE, this.defaultAdmin),
    ).to.be.revertedWithCustomError(this.mock, 'AccessControlEnforcedDefaultAdminRules');
  });

  it('should revert if revoking default admin role', async function () {
    await expect(
      this.mock.connect(this.defaultAdmin).revokeRole(DEFAULT_ADMIN_ROLE, this.defaultAdmin),
    ).to.be.revertedWithCustomError(this.mock, 'AccessControlEnforcedDefaultAdminRules');
  });

  it("should revert if defaultAdmin's admin is changed", async function () {
    await expect(this.mock.$_setRoleAdmin(DEFAULT_ADMIN_ROLE, OTHER_ROLE)).to.be.revertedWithCustomError(
      this.mock,
      'AccessControlEnforcedDefaultAdminRules',
    );
  });

  it('should not grant the default admin role twice', async function () {
    await expect(this.mock.$_grantRole(DEFAULT_ADMIN_ROLE, this.defaultAdmin)).to.be.revertedWithCustomError(
      this.mock,
      'AccessControlEnforcedDefaultAdminRules',
    );
  });

  describe('begins a default admin transfer', function () {
    it('reverts if called by non default admin accounts', async function () {
      await expect(this.mock.connect(this.other).beginDefaultAdminTransfer(this.newDefaultAdmin))
        .to.be.revertedWithCustomError(this.mock, 'AccessControlUnauthorizedAccount')
        .withArgs(this.other, DEFAULT_ADMIN_ROLE);
    });

    describe('when there is no pending delay nor pending admin transfer', function () {
      it('should set pending default admin and schedule', async function () {
        const nextBlockTimestamp = (await time.clock.timestamp()) + 1n;
        const acceptSchedule = nextBlockTimestamp + this.delay;

        await time.increaseTo.timestamp(nextBlockTimestamp, false); // set timestamp but don't mine the block yet
        await expect(this.mock.connect(this.defaultAdmin).beginDefaultAdminTransfer(this.newDefaultAdmin))
          .to.emit(this.mock, 'DefaultAdminTransferScheduled')
          .withArgs(this.newDefaultAdmin, acceptSchedule);

        const { newAdmin, schedule } = await this.mock.pendingDefaultAdmin();
        expect(newAdmin).to.equal(this.newDefaultAdmin);
        expect(schedule).to.equal(acceptSchedule);
      });
    });

    describe('when there is a pending admin transfer', function () {
      beforeEach('sets a pending default admin transfer', async function () {
        await this.mock.connect(this.defaultAdmin).beginDefaultAdminTransfer(this.newDefaultAdmin);
        this.acceptSchedule = (await time.clock.timestamp()) + this.delay;
      });

      for (const [fromSchedule, tag] of [
        [-1n, 'before'],
        [0n, 'exactly when'],
        [1n, 'after'],
      ]) {
        it(`should be able to begin a transfer again ${tag} acceptSchedule passes`, async function () {
          // Wait until schedule + fromSchedule
          await time.increaseTo.timestamp(this.acceptSchedule + fromSchedule, false);

          // defaultAdmin changes its mind and begins again to another address
          await expect(this.mock.connect(this.defaultAdmin).beginDefaultAdminTransfer(this.other)).to.emit(
            this.mock,
            'DefaultAdminTransferCanceled', // Cancellation is always emitted since it was never accepted
          );
          const newSchedule = (await time.clock.timestamp()) + this.delay;
          const { newAdmin, schedule } = await this.mock.pendingDefaultAdmin();
          expect(newAdmin).to.equal(this.other);
          expect(schedule).to.equal(newSchedule);
        });
      }

      it('should not emit a cancellation event if the new default admin accepted', async function () {
        // Wait until the acceptSchedule has passed
        await time.increaseTo.timestamp(this.acceptSchedule + 1n, false);

        // Accept and restart
        await this.mock.connect(this.newDefaultAdmin).acceptDefaultAdminTransfer();
        await expect(this.mock.connect(this.newDefaultAdmin).beginDefaultAdminTransfer(this.other)).to.not.emit(
          this.mock,
          'DefaultAdminTransferCanceled',
        );
      });
    });

    describe('when there is a pending delay', function () {
      const newDelay = time.duration.hours(3);

      beforeEach('schedule a delay change', async function () {
        await this.mock.connect(this.defaultAdmin).changeDefaultAdminDelay(newDelay);
        ({ schedule: this.effectSchedule } = await this.mock.pendingDefaultAdminDelay());
      });

      for (const [fromSchedule, schedulePassed, expectNewDelay] of [
        [-1n, 'before', false],
        [0n, 'exactly when', false],
        [1n, 'after', true],
      ]) {
        it(`should set the ${
          expectNewDelay ? 'new' : 'old'
        } delay and apply it to next default admin transfer schedule ${schedulePassed} effectSchedule passed`, async function () {
          // Wait until the expected fromSchedule time
          const nextBlockTimestamp = this.effectSchedule + fromSchedule;
          await time.increaseTo.timestamp(nextBlockTimestamp, false);

          // Start the new default admin transfer and get its schedule
          const expectedDelay = expectNewDelay ? newDelay : this.delay;
          const expectedAcceptSchedule = nextBlockTimestamp + expectedDelay;
          await expect(this.mock.connect(this.defaultAdmin).beginDefaultAdminTransfer(this.newDefaultAdmin))
            .to.emit(this.mock, 'DefaultAdminTransferScheduled')
            .withArgs(this.newDefaultAdmin, expectedAcceptSchedule);

          // Check that the schedule corresponds with the new delay
          const { newAdmin, schedule: transferSchedule } = await this.mock.pendingDefaultAdmin();
          expect(newAdmin).to.equal(this.newDefaultAdmin);
          expect(transferSchedule).to.equal(expectedAcceptSchedule);
        });
      }
    });
  });

  describe('accepts transfer admin', function () {
    beforeEach(async function () {
      await this.mock.connect(this.defaultAdmin).beginDefaultAdminTransfer(this.newDefaultAdmin);
      this.acceptSchedule = (await time.clock.timestamp()) + this.delay;
    });

    it('should revert if caller is not pending default admin', async function () {
      await time.increaseTo.timestamp(this.acceptSchedule + 1n, false);
      await expect(this.mock.connect(this.other).acceptDefaultAdminTransfer())
        .to.be.revertedWithCustomError(this.mock, 'AccessControlInvalidDefaultAdmin')
        .withArgs(this.other);
    });

    describe('when caller is pending default admin and delay has passed', function () {
      beforeEach(async function () {
        await time.increaseTo.timestamp(this.acceptSchedule + 1n, false);
      });

      it('accepts a transfer and changes default admin', async function () {
        // Emit events
        await expect(this.mock.connect(this.newDefaultAdmin).acceptDefaultAdminTransfer())
          .to.emit(this.mock, 'RoleRevoked')
          .withArgs(DEFAULT_ADMIN_ROLE, this.defaultAdmin, this.newDefaultAdmin)
          .to.emit(this.mock, 'RoleGranted')
          .withArgs(DEFAULT_ADMIN_ROLE, this.newDefaultAdmin, this.newDefaultAdmin);

        // Storage changes
        expect(await this.mock.hasRole(DEFAULT_ADMIN_ROLE, this.defaultAdmin)).to.be.false;
        expect(await this.mock.hasRole(DEFAULT_ADMIN_ROLE, this.newDefaultAdmin)).to.be.true;
        expect(await this.mock.owner()).to.equal(this.newDefaultAdmin);

        // Resets pending default admin and schedule
        const { newAdmin, schedule } = await this.mock.pendingDefaultAdmin();
        expect(newAdmin).to.equal(ethers.ZeroAddress);
        expect(schedule).to.equal(0);
      });
    });

    describe('schedule not passed', function () {
      for (const [fromSchedule, tag] of [
        [-1n, 'less'],
        [0n, 'equal'],
      ]) {
        it(`should revert if block.timestamp is ${tag} to schedule`, async function () {
          await time.increaseTo.timestamp(this.acceptSchedule + fromSchedule, false);
          await expect(this.mock.connect(this.newDefaultAdmin).acceptDefaultAdminTransfer())
            .to.be.revertedWithCustomError(this.mock, 'AccessControlEnforcedDefaultAdminDelay')
            .withArgs(this.acceptSchedule);
        });
      }
    });
  });

  describe('cancels a default admin transfer', function () {
    it('reverts if called by non default admin accounts', async function () {
      await expect(this.mock.connect(this.other).cancelDefaultAdminTransfer())
        .to.be.revertedWithCustomError(this.mock, 'AccessControlUnauthorizedAccount')
        .withArgs(this.other, DEFAULT_ADMIN_ROLE);
    });

    describe('when there is a pending default admin transfer', function () {
      beforeEach(async function () {
        await this.mock.connect(this.defaultAdmin).beginDefaultAdminTransfer(this.newDefaultAdmin);
        this.acceptSchedule = (await time.clock.timestamp()) + this.delay;
      });

      for (const [fromSchedule, tag] of [
        [-1n, 'before'],
        [0n, 'exactly when'],
        [1n, 'after'],
      ]) {
        it(`resets pending default admin and schedule ${tag} transfer schedule passes`, async function () {
          // Advance until passed delay
          await time.increaseTo.timestamp(this.acceptSchedule + fromSchedule, false);

          await expect(this.mock.connect(this.defaultAdmin).cancelDefaultAdminTransfer()).to.emit(
            this.mock,
            'DefaultAdminTransferCanceled',
          );

          const { newAdmin, schedule } = await this.mock.pendingDefaultAdmin();
          expect(newAdmin).to.equal(ethers.ZeroAddress);
          expect(schedule).to.equal(0);
        });
      }

      it('should revert if the previous default admin tries to accept', async function () {
        await this.mock.connect(this.defaultAdmin).cancelDefaultAdminTransfer();

        // Advance until passed delay
        await time.increaseTo.timestamp(this.acceptSchedule + 1n, false);

        // Previous pending default admin should not be able to accept after cancellation.
        await expect(this.mock.connect(this.newDefaultAdmin).acceptDefaultAdminTransfer())
          .to.be.revertedWithCustomError(this.mock, 'AccessControlInvalidDefaultAdmin')
          .withArgs(this.newDefaultAdmin);
      });
    });

    describe('when there is no pending default admin transfer', function () {
      it('should succeed without changes', async function () {
        await expect(this.mock.connect(this.defaultAdmin).cancelDefaultAdminTransfer()).to.not.emit(
          this.mock,
          'DefaultAdminTransferCanceled',
        );

        const { newAdmin, schedule } = await this.mock.pendingDefaultAdmin();
        expect(newAdmin).to.equal(ethers.ZeroAddress);
        expect(schedule).to.equal(0);
      });
    });
  });

  describe('renounces admin', function () {
    beforeEach(async function () {
      await this.mock.connect(this.defaultAdmin).beginDefaultAdminTransfer(ethers.ZeroAddress);
      this.expectedSchedule = (await time.clock.timestamp()) + this.delay;
    });

    it('reverts if caller is not default admin', async function () {
      await time.increaseBy.timestamp(this.delay + 1n, false);
      await expect(
        this.mock.connect(this.defaultAdmin).renounceRole(DEFAULT_ADMIN_ROLE, this.other),
      ).to.be.revertedWithCustomError(this.mock, 'AccessControlBadConfirmation');
    });

    it("renouncing the admin role when not an admin doesn't affect the schedule", async function () {
      await time.increaseBy.timestamp(this.delay + 1n, false);
      await this.mock.connect(this.other).renounceRole(DEFAULT_ADMIN_ROLE, this.other);

      const { newAdmin, schedule } = await this.mock.pendingDefaultAdmin();
      expect(newAdmin).to.equal(ethers.ZeroAddress);
      expect(schedule).to.equal(this.expectedSchedule);
    });

    it('keeps defaultAdmin consistent with hasRole if another non-defaultAdmin user renounces the DEFAULT_ADMIN_ROLE', async function () {
      await time.increaseBy.timestamp(this.delay + 1n, false);

      // This passes because it's a noop
      await this.mock.connect(this.other).renounceRole(DEFAULT_ADMIN_ROLE, this.other);

      expect(await this.mock.hasRole(DEFAULT_ADMIN_ROLE, this.defaultAdmin)).to.be.true;
      expect(await this.mock.defaultAdmin()).to.equal(this.defaultAdmin);
    });

    it('renounces role', async function () {
      await time.increaseBy.timestamp(this.delay + 1n, false);
      await expect(this.mock.connect(this.defaultAdmin).renounceRole(DEFAULT_ADMIN_ROLE, this.defaultAdmin))
        .to.emit(this.mock, 'RoleRevoked')
        .withArgs(DEFAULT_ADMIN_ROLE, this.defaultAdmin, this.defaultAdmin);

      expect(await this.mock.hasRole(DEFAULT_ADMIN_ROLE, this.defaultAdmin)).to.be.false;
      expect(await this.mock.defaultAdmin()).to.equal(ethers.ZeroAddress);
      expect(await this.mock.owner()).to.equal(ethers.ZeroAddress);

      const { newAdmin, schedule } = await this.mock.pendingDefaultAdmin();
      expect(newAdmin).to.equal(ethers.ZeroAddress);
      expect(schedule).to.equal(0);
    });

    it('allows to recover access using the internal _grantRole', async function () {
      await time.increaseBy.timestamp(this.delay + 1n, false);
      await this.mock.connect(this.defaultAdmin).renounceRole(DEFAULT_ADMIN_ROLE, this.defaultAdmin);

      await expect(this.mock.connect(this.defaultAdmin).$_grantRole(DEFAULT_ADMIN_ROLE, this.other))
        .to.emit(this.mock, 'RoleGranted')
        .withArgs(DEFAULT_ADMIN_ROLE, this.other, this.defaultAdmin);
    });

    describe('schedule not passed', function () {
      for (const [fromSchedule, tag] of [
        [-1n, 'less'],
        [0n, 'equal'],
      ]) {
        it(`reverts if block.timestamp is ${tag} to schedule`, async function () {
          await time.increaseBy.timestamp(this.delay + fromSchedule, false);
          await expect(this.mock.connect(this.defaultAdmin).renounceRole(DEFAULT_ADMIN_ROLE, this.defaultAdmin))
            .to.be.revertedWithCustomError(this.mock, 'AccessControlEnforcedDefaultAdminDelay')
            .withArgs(this.expectedSchedule);
        });
      }
    });
  });

  describe('changes delay', function () {
    it('reverts if called by non default admin accounts', async function () {
      await expect(this.mock.connect(this.other).changeDefaultAdminDelay(time.duration.hours(4)))
        .to.be.revertedWithCustomError(this.mock, 'AccessControlUnauthorizedAccount')
        .withArgs(this.other, DEFAULT_ADMIN_ROLE);
    });

    for (const [delayDifference, delayChangeType] of [
      [time.duration.hours(-1), 'decreased'],
      [time.duration.hours(1), 'increased'],
      [time.duration.days(5), 'increased to more than 5 days'],
    ]) {
      describe(`when the delay is ${delayChangeType}`, function () {
        beforeEach(function () {
          this.newDefaultAdminDelay = this.delay + delayDifference;
        });

        it('begins the delay change to the new delay', async function () {
          // Calculate expected values
          const capWait = await this.mock.defaultAdminDelayIncreaseWait();
          const minWait = capWait < this.newDefaultAdminDelay ? capWait : this.newDefaultAdminDelay;
          const changeDelay =
            this.newDefaultAdminDelay <= this.delay ? this.delay - this.newDefaultAdminDelay : minWait;
          const nextBlockTimestamp = (await time.clock.timestamp()) + 1n;
          const effectSchedule = nextBlockTimestamp + changeDelay;

          await time.increaseTo.timestamp(nextBlockTimestamp, false);

          // Begins the change
          await expect(this.mock.connect(this.defaultAdmin).changeDefaultAdminDelay(this.newDefaultAdminDelay))
            .to.emit(this.mock, 'DefaultAdminDelayChangeScheduled')
            .withArgs(this.newDefaultAdminDelay, effectSchedule);

          // Assert
          const { newDelay, schedule } = await this.mock.pendingDefaultAdminDelay();
          expect(newDelay).to.equal(this.newDefaultAdminDelay);
          expect(schedule).to.equal(effectSchedule);
        });

        describe('scheduling again', function () {
          beforeEach('schedule once', async function () {
            await this.mock.connect(this.defaultAdmin).changeDefaultAdminDelay(this.newDefaultAdminDelay);
          });

          for (const [fromSchedule, tag] of [
            [-1n, 'before'],
            [0n, 'exactly when'],
            [1n, 'after'],
          ]) {
            const passed = fromSchedule > 0;

            it(`succeeds ${tag} the delay schedule passes`, async function () {
              // Wait until schedule + fromSchedule
              const { schedule: firstSchedule } = await this.mock.pendingDefaultAdminDelay();
              const nextBlockTimestamp = firstSchedule + fromSchedule;
              await time.increaseTo.timestamp(nextBlockTimestamp, false);

              // Calculate expected values
              const anotherNewDefaultAdminDelay = this.newDefaultAdminDelay + time.duration.hours(2);
              const capWait = await this.mock.defaultAdminDelayIncreaseWait();
              const minWait = capWait < anotherNewDefaultAdminDelay ? capWait : anotherNewDefaultAdminDelay;
              const effectSchedule = nextBlockTimestamp + minWait;

              // Default admin changes its mind and begins another delay change
              await expect(this.mock.connect(this.defaultAdmin).changeDefaultAdminDelay(anotherNewDefaultAdminDelay))
                .to.emit(this.mock, 'DefaultAdminDelayChangeScheduled')
                .withArgs(anotherNewDefaultAdminDelay, effectSchedule);

              // Assert
              const { newDelay, schedule } = await this.mock.pendingDefaultAdminDelay();
              expect(newDelay).to.equal(anotherNewDefaultAdminDelay);
              expect(schedule).to.equal(effectSchedule);
            });

            const emit = passed ? 'not emit' : 'emit';
            it(`should ${emit} a cancellation event ${tag} the delay schedule passes`, async function () {
              // Wait until schedule + fromSchedule
              const { schedule: firstSchedule } = await this.mock.pendingDefaultAdminDelay();
              await time.increaseTo.timestamp(firstSchedule + fromSchedule, false);

              // Default admin changes its mind and begins another delay change
              const anotherNewDefaultAdminDelay = this.newDefaultAdminDelay + time.duration.hours(2);

              const expected = expect(
                this.mock.connect(this.defaultAdmin).changeDefaultAdminDelay(anotherNewDefaultAdminDelay),
              );
              if (passed) {
                await expected.to.not.emit(this.mock, 'DefaultAdminDelayChangeCanceled');
              } else {
                await expected.to.emit(this.mock, 'DefaultAdminDelayChangeCanceled');
              }
            });
          }
        });
      });
    }
  });

  describe('rollbacks a delay change', function () {
    it('reverts if called by non default admin accounts', async function () {
      await expect(this.mock.connect(this.other).rollbackDefaultAdminDelay())
        .to.be.revertedWithCustomError(this.mock, 'AccessControlUnauthorizedAccount')
        .withArgs(this.other, DEFAULT_ADMIN_ROLE);
    });

    describe('when there is a pending delay', function () {
      beforeEach('set pending delay', async function () {
        await this.mock.connect(this.defaultAdmin).changeDefaultAdminDelay(time.duration.hours(12));
      });

      for (const [fromSchedule, tag] of [
        [-1n, 'before'],
        [0n, 'exactly when'],
        [1n, 'after'],
      ]) {
        const passed = fromSchedule > 0;

        it(`resets pending delay and schedule ${tag} delay change schedule passes`, async function () {
          // Wait until schedule + fromSchedule
          const { schedule: firstSchedule } = await this.mock.pendingDefaultAdminDelay();
          await time.increaseTo.timestamp(firstSchedule + fromSchedule, false);

          await this.mock.connect(this.defaultAdmin).rollbackDefaultAdminDelay();

          const { newDelay, schedule } = await this.mock.pendingDefaultAdminDelay();
          expect(newDelay).to.equal(0);
          expect(schedule).to.equal(0);
        });

        const emit = passed ? 'not emit' : 'emit';
        it(`should ${emit} a cancellation event ${tag} the delay schedule passes`, async function () {
          // Wait until schedule + fromSchedule
          const { schedule: firstSchedule } = await this.mock.pendingDefaultAdminDelay();
          await time.increaseTo.timestamp(firstSchedule + fromSchedule, false);

          const expected = expect(this.mock.connect(this.defaultAdmin).rollbackDefaultAdminDelay());
          if (passed) {
            await expected.to.not.emit(this.mock, 'DefaultAdminDelayChangeCanceled');
          } else {
            await expected.to.emit(this.mock, 'DefaultAdminDelayChangeCanceled');
          }
        });
      }
    });

    describe('when there is no pending delay', function () {
      it('succeeds without changes', async function () {
        await this.mock.connect(this.defaultAdmin).rollbackDefaultAdminDelay();

        const { newDelay, schedule } = await this.mock.pendingDefaultAdminDelay();
        expect(newDelay).to.equal(0);
        expect(schedule).to.equal(0);
      });
    });
  });
}

module.exports = {
  DEFAULT_ADMIN_ROLE,
  shouldBehaveLikeAccessControl,
  shouldBehaveLikeAccessControlEnumerable,
  shouldBehaveLikeAccessControlDefaultAdminRules,
};
