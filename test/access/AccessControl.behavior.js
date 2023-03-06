const { expectEvent, expectRevert, constants } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { time } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldSupportInterfaces } = require('../utils/introspection/SupportsInterface.behavior');
const { network } = require('hardhat');

const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
const ROLE = web3.utils.soliditySha3('ROLE');
const OTHER_ROLE = web3.utils.soliditySha3('OTHER_ROLE');

function shouldBehaveLikeAccessControl(errorPrefix, admin, authorized, other, otherAdmin) {
  shouldSupportInterfaces(['AccessControl']);

  describe('default admin', function () {
    it('deployer has default admin role', async function () {
      expect(await this.accessControl.hasRole(DEFAULT_ADMIN_ROLE, admin)).to.equal(true);
    });

    it("other roles's admin is the default admin role", async function () {
      expect(await this.accessControl.getRoleAdmin(ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
    });

    it("default admin role's admin is itself", async function () {
      expect(await this.accessControl.getRoleAdmin(DEFAULT_ADMIN_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
    });
  });

  describe('granting', function () {
    beforeEach(async function () {
      await this.accessControl.grantRole(ROLE, authorized, { from: admin });
    });

    it('non-admin cannot grant role to other accounts', async function () {
      await expectRevert(
        this.accessControl.grantRole(ROLE, authorized, { from: other }),
        `${errorPrefix}: account ${other.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`,
      );
    });

    it('accounts can be granted a role multiple times', async function () {
      await this.accessControl.grantRole(ROLE, authorized, { from: admin });
      const receipt = await this.accessControl.grantRole(ROLE, authorized, { from: admin });
      expectEvent.notEmitted(receipt, 'RoleGranted');
    });
  });

  describe('revoking', function () {
    it('roles that are not had can be revoked', async function () {
      expect(await this.accessControl.hasRole(ROLE, authorized)).to.equal(false);

      const receipt = await this.accessControl.revokeRole(ROLE, authorized, { from: admin });
      expectEvent.notEmitted(receipt, 'RoleRevoked');
    });

    context('with granted role', function () {
      beforeEach(async function () {
        await this.accessControl.grantRole(ROLE, authorized, { from: admin });
      });

      it('admin can revoke role', async function () {
        const receipt = await this.accessControl.revokeRole(ROLE, authorized, { from: admin });
        expectEvent(receipt, 'RoleRevoked', { account: authorized, role: ROLE, sender: admin });

        expect(await this.accessControl.hasRole(ROLE, authorized)).to.equal(false);
      });

      it('non-admin cannot revoke role', async function () {
        await expectRevert(
          this.accessControl.revokeRole(ROLE, authorized, { from: other }),
          `${errorPrefix}: account ${other.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`,
        );
      });

      it('a role can be revoked multiple times', async function () {
        await this.accessControl.revokeRole(ROLE, authorized, { from: admin });

        const receipt = await this.accessControl.revokeRole(ROLE, authorized, { from: admin });
        expectEvent.notEmitted(receipt, 'RoleRevoked');
      });
    });
  });

  describe('renouncing', function () {
    it('roles that are not had can be renounced', async function () {
      const receipt = await this.accessControl.renounceRole(ROLE, authorized, { from: authorized });
      expectEvent.notEmitted(receipt, 'RoleRevoked');
    });

    context('with granted role', function () {
      beforeEach(async function () {
        await this.accessControl.grantRole(ROLE, authorized, { from: admin });
      });

      it('bearer can renounce role', async function () {
        const receipt = await this.accessControl.renounceRole(ROLE, authorized, { from: authorized });
        expectEvent(receipt, 'RoleRevoked', { account: authorized, role: ROLE, sender: authorized });

        expect(await this.accessControl.hasRole(ROLE, authorized)).to.equal(false);
      });

      it('only the sender can renounce their roles', async function () {
        await expectRevert(
          this.accessControl.renounceRole(ROLE, authorized, { from: admin }),
          `${errorPrefix}: can only renounce roles for self`,
        );
      });

      it('a role can be renounced multiple times', async function () {
        await this.accessControl.renounceRole(ROLE, authorized, { from: authorized });

        const receipt = await this.accessControl.renounceRole(ROLE, authorized, { from: authorized });
        expectEvent.notEmitted(receipt, 'RoleRevoked');
      });
    });
  });

  describe('setting role admin', function () {
    beforeEach(async function () {
      const receipt = await this.accessControl.$_setRoleAdmin(ROLE, OTHER_ROLE);
      expectEvent(receipt, 'RoleAdminChanged', {
        role: ROLE,
        previousAdminRole: DEFAULT_ADMIN_ROLE,
        newAdminRole: OTHER_ROLE,
      });

      await this.accessControl.grantRole(OTHER_ROLE, otherAdmin, { from: admin });
    });

    it("a role's admin role can be changed", async function () {
      expect(await this.accessControl.getRoleAdmin(ROLE)).to.equal(OTHER_ROLE);
    });

    it('the new admin can grant roles', async function () {
      const receipt = await this.accessControl.grantRole(ROLE, authorized, { from: otherAdmin });
      expectEvent(receipt, 'RoleGranted', { account: authorized, role: ROLE, sender: otherAdmin });
    });

    it('the new admin can revoke roles', async function () {
      await this.accessControl.grantRole(ROLE, authorized, { from: otherAdmin });
      const receipt = await this.accessControl.revokeRole(ROLE, authorized, { from: otherAdmin });
      expectEvent(receipt, 'RoleRevoked', { account: authorized, role: ROLE, sender: otherAdmin });
    });

    it("a role's previous admins no longer grant roles", async function () {
      await expectRevert(
        this.accessControl.grantRole(ROLE, authorized, { from: admin }),
        `${errorPrefix}: account ${admin.toLowerCase()} is missing role ${OTHER_ROLE}`,
      );
    });

    it("a role's previous admins no longer revoke roles", async function () {
      await expectRevert(
        this.accessControl.revokeRole(ROLE, authorized, { from: admin }),
        `${errorPrefix}: account ${admin.toLowerCase()} is missing role ${OTHER_ROLE}`,
      );
    });
  });

  describe('onlyRole modifier', function () {
    beforeEach(async function () {
      await this.accessControl.grantRole(ROLE, authorized, { from: admin });
    });

    it('do not revert if sender has role', async function () {
      await this.accessControl.methods['$_checkRole(bytes32)'](ROLE, { from: authorized });
    });

    it("revert if sender doesn't have role #1", async function () {
      await expectRevert(
        this.accessControl.methods['$_checkRole(bytes32)'](ROLE, { from: other }),
        `${errorPrefix}: account ${other.toLowerCase()} is missing role ${ROLE}`,
      );
    });

    it("revert if sender doesn't have role #2", async function () {
      await expectRevert(
        this.accessControl.methods['$_checkRole(bytes32)'](OTHER_ROLE, { from: authorized }),
        `${errorPrefix}: account ${authorized.toLowerCase()} is missing role ${OTHER_ROLE}`,
      );
    });
  });
}

function shouldBehaveLikeAccessControlEnumerable(errorPrefix, admin, authorized, other, otherAdmin, otherAuthorized) {
  shouldSupportInterfaces(['AccessControlEnumerable']);

  describe('enumerating', function () {
    it('role bearers can be enumerated', async function () {
      await this.accessControl.grantRole(ROLE, authorized, { from: admin });
      await this.accessControl.grantRole(ROLE, other, { from: admin });
      await this.accessControl.grantRole(ROLE, otherAuthorized, { from: admin });
      await this.accessControl.revokeRole(ROLE, other, { from: admin });

      const memberCount = await this.accessControl.getRoleMemberCount(ROLE);
      expect(memberCount).to.bignumber.equal('2');

      const bearers = [];
      for (let i = 0; i < memberCount; ++i) {
        bearers.push(await this.accessControl.getRoleMember(ROLE, i));
      }

      expect(bearers).to.have.members([authorized, otherAuthorized]);
    });
    it('role enumeration should be in sync after renounceRole call', async function () {
      expect(await this.accessControl.getRoleMemberCount(ROLE)).to.bignumber.equal('0');
      await this.accessControl.grantRole(ROLE, admin, { from: admin });
      expect(await this.accessControl.getRoleMemberCount(ROLE)).to.bignumber.equal('1');
      await this.accessControl.renounceRole(ROLE, admin, { from: admin });
      expect(await this.accessControl.getRoleMemberCount(ROLE)).to.bignumber.equal('0');
    });
  });
}

function shouldBehaveLikeAccessControlDefaultAdminRules(errorPrefix, delay, defaultAdmin, newDefaultAdmin, other) {
  shouldSupportInterfaces(['AccessControlDefaultAdminRules']);

  it('has a default disabled default admin transfer schedule', async function () {
    expect(await this.accessControl.defaultAdminTransferSchedule()).to.be.bignumber.equal(web3.utils.toBN(0));
  });

  it('has an initial default admin', async function () {
    expect(await this.accessControl.defaultAdmin()).to.be.equal(defaultAdmin);
  });

  it('has no initial pending default admin', async function () {
    expect(await this.accessControl.pendingDefaultAdmin()).to.equal(constants.ZERO_ADDRESS);
  });

  it('has a default disabled delay change schedule', async function () {
    expect(await this.accessControl.pendingDefaultAdmin()).to.equal(constants.ZERO_ADDRESS);
  });

  it('has a default current owner set to the initial default admin', async function () {
    const owner = await this.accessControl.owner();
    expect(owner).to.equal(defaultAdmin);
    expect(await this.accessControl.hasRole(DEFAULT_ADMIN_ROLE, owner)).to.be.true;
  });

  it('should revert if granting default admin role', async function () {
    await expectRevert(
      this.accessControl.grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin, { from: defaultAdmin }),
      `${errorPrefix}: can't directly grant default admin role`,
    );
  });

  it('should revert if revoking default admin role', async function () {
    await expectRevert(
      this.accessControl.revokeRole(DEFAULT_ADMIN_ROLE, defaultAdmin, { from: defaultAdmin }),
      `${errorPrefix}: can't directly revoke default admin role`,
    );
  });

  it("should revert if defaultAdmin's admin is changed", async function () {
    await expectRevert(
      this.accessControl.$_setRoleAdmin(DEFAULT_ADMIN_ROLE, defaultAdmin),
      `${errorPrefix}: can't violate default admin rules`,
    );
  });

  it('should not grant the default admin role twice', async function () {
    await expectRevert(
      this.accessControl.$_grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin),
      `${errorPrefix}: default admin already granted`,
    );
  });

  describe('default admin delay', function () {
    it('has an initial delay', async function () {
      expect(await this.accessControl.defaultAdminDelay()).to.be.bignumber.equal(web3.utils.toBN(delay));
    });

    it('pending default admin delay kicks in after schedule is passed', async function () {
      const newDelay = web3.utils.toBN(time.duration.days(3)).add(delay); // Increased, so it waits the `newDelay`
      await this.accessControl.scheduleDefaultAdminDelayChange(newDelay, { from: defaultAdmin });

      // Initial value
      expect(await this.accessControl.defaultAdminDelay()).to.be.bignumber.equal(web3.utils.toBN(delay));

      // Wait until schedule is met
      const newSchedule = web3.utils.toBN(await time.latest()).add(newDelay);
      await time.setNextBlockTimestamp(newSchedule.addn(1));
      await network.provider.send('evm_mine'); // Mine a block to force the timestamp

      // New value
      expect(await this.accessControl.defaultAdminDelay()).to.be.bignumber.equal(web3.utils.toBN(newDelay));
    });
  });

  describe('pending default admin delay', function () {
    it('has no initial pending delay', async function () {
      expect(await this.accessControl.pendingDefaultAdminDelay()).to.be.bignumber.equal(web3.utils.toBN(0));
    });

    it('pending default is set and set to 0 after schedule passes', async function () {
      // Initial value
      expect(await this.accessControl.pendingDefaultAdminDelay()).to.be.bignumber.equal(web3.utils.toBN(0));

      const newDelay = web3.utils.toBN(time.duration.days(3)).add(delay); // Increased, so it waits the `newDelay`
      await this.accessControl.scheduleDefaultAdminDelayChange(newDelay, { from: defaultAdmin });

      // Pending value
      expect(await this.accessControl.pendingDefaultAdminDelay()).to.be.bignumber.equal(newDelay);

      // Wait until schedule is met
      const newSchedule = web3.utils.toBN(await time.latest()).add(newDelay);
      await time.setNextBlockTimestamp(newSchedule.addn(1));
      await network.provider.send('evm_mine'); // Mine a block to force the timestamp

      // Not pending anymore
      expect(await this.accessControl.pendingDefaultAdminDelay()).to.be.bignumber.equal(web3.utils.toBN(0));
    });
  });

  describe('begins transfer of default admin', function () {
    describe('when a delay change is scheduled', function () {
      let newDelay;
      let delayChangeSchedule;

      beforeEach('schedule delay change', async function () {
        newDelay = web3.utils.toBN(time.duration.days(3));
        await this.accessControl.scheduleDefaultAdminDelayChange(newDelay, { from: defaultAdmin });
        delayChangeSchedule = await this.accessControl.defaultAdminDelayChangeSchedule();
      });

      it('should set the new delay and apply it to next default admin schedule', async function () {
        // Wait until the scheduled delay change goes into effect
        await time.setNextBlockTimestamp(delayChangeSchedule.addn(1));

        // Start the new default admin transfer and get its schedule
        const receipt = await this.accessControl.beginDefaultAdminTransfer(newDefaultAdmin, { from: defaultAdmin });
        const defaultAdminTransferSchedule = web3.utils.toBN(await time.latest()).add(newDelay);

        // Check that the schedule corresponds with the new delay
        expect(await this.accessControl.pendingDefaultAdmin()).to.equal(newDefaultAdmin);
        expect(await this.accessControl.defaultAdminTransferSchedule()).to.be.bignumber.equal(
          defaultAdminTransferSchedule,
        );
        expectEvent(receipt, 'DefaultAdminRoleChangeStarted', {
          newDefaultAdmin,
          defaultAdminTransferSchedule,
        });
      });

      it('should revert if the schedule has not passed', async function () {
        await time.setNextBlockTimestamp(delayChangeSchedule.subn(1)); // Just before
        await expectRevert(
          this.accessControl.beginDefaultAdminTransfer(newDefaultAdmin, { from: defaultAdmin }),
          `${errorPrefix}: Delay change in progress`,
        );
      });
    });

    describe('when no delay change is scheduled', function () {
      let receipt;
      let defaultAdminTransferSchedule;

      beforeEach('begins admin transfer', async function () {
        receipt = await this.accessControl.beginDefaultAdminTransfer(newDefaultAdmin, { from: defaultAdmin });
        defaultAdminTransferSchedule = web3.utils.toBN(await time.latest()).add(delay);
      });

      it('should set pending default admin and schedule', async function () {
        expect(await this.accessControl.pendingDefaultAdmin()).to.equal(newDefaultAdmin);
        expect(await this.accessControl.defaultAdminTransferSchedule()).to.be.bignumber.equal(
          defaultAdminTransferSchedule,
        );
        expectEvent(receipt, 'DefaultAdminRoleChangeStarted', {
          newDefaultAdmin,
          defaultAdminTransferSchedule,
        });
      });

      it('should be able to begin a transfer again before delay pass', async function () {
        // Time passes just before delay
        await time.setNextBlockTimestamp(defaultAdminTransferSchedule.subn(1));

        // defaultAdmin changes its mind and begin again to another address
        await this.accessControl.beginDefaultAdminTransfer(other, { from: defaultAdmin });
        const newSchedule = web3.utils.toBN(await time.latest()).add(delay);
        expect(await this.accessControl.pendingDefaultAdmin()).to.equal(other);
        expect(await this.accessControl.defaultAdminTransferSchedule()).to.be.bignumber.equal(newSchedule);
      });

      it('should be able to begin a transfer again after delay pass if not accepted', async function () {
        // Time passes after delay without acceptance
        await time.setNextBlockTimestamp(defaultAdminTransferSchedule.addn(1));

        // defaultAdmin changes its mind and begin again to another address
        await this.accessControl.beginDefaultAdminTransfer(other, { from: defaultAdmin });
        const newSchedule = web3.utils.toBN(await time.latest()).add(delay);
        expect(await this.accessControl.pendingDefaultAdmin()).to.equal(other);
        expect(await this.accessControl.defaultAdminTransferSchedule()).to.be.bignumber.equal(newSchedule);
      });

      it('should revert if it is called by non-admin accounts', async function () {
        await expectRevert(
          this.accessControl.beginDefaultAdminTransfer(newDefaultAdmin, { from: other }),
          `${errorPrefix}: account ${other.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`,
        );
      });
    });
  });

  describe('accepts transfer admin', function () {
    let delayPassed;

    beforeEach(async function () {
      await this.accessControl.beginDefaultAdminTransfer(newDefaultAdmin, { from: defaultAdmin });
      delayPassed = web3.utils
        .toBN(await time.latest())
        .add(delay)
        .addn(1);
    });

    describe('caller is pending default admin and delay has passed', function () {
      let from;

      beforeEach(async function () {
        await time.setNextBlockTimestamp(delayPassed);
        from = newDefaultAdmin;
      });

      it('accepts a transfer and changes default admin', async function () {
        const receipt = await this.accessControl.acceptDefaultAdminTransfer({ from });

        // Storage changes
        expect(await this.accessControl.hasRole(DEFAULT_ADMIN_ROLE, defaultAdmin)).to.be.false;
        expect(await this.accessControl.hasRole(DEFAULT_ADMIN_ROLE, newDefaultAdmin)).to.be.true;
        expect(await this.accessControl.owner()).to.equal(newDefaultAdmin);

        // Emit events
        expectEvent(receipt, 'RoleRevoked', {
          role: DEFAULT_ADMIN_ROLE,
          account: defaultAdmin,
        });
        expectEvent(receipt, 'RoleGranted', {
          role: DEFAULT_ADMIN_ROLE,
          account: newDefaultAdmin,
        });

        // Resets pending default admin and schedule
        expect(await this.accessControl.defaultAdminTransferSchedule()).to.be.bignumber.equal(web3.utils.toBN(0));
        expect(await this.accessControl.pendingDefaultAdmin()).to.equal(constants.ZERO_ADDRESS);
      });
    });

    it('should revert if caller is not pending default admin', async function () {
      await time.setNextBlockTimestamp(delayPassed);
      await expectRevert(
        this.accessControl.acceptDefaultAdminTransfer({ from: other }),
        `${errorPrefix}: pending admin must accept`,
      );
    });

    describe('schedule not passed', function () {
      let delayNotPassed;

      beforeEach(function () {
        delayNotPassed = delayPassed.subn(1);
      });

      it('should revert if block.timestamp is equal to schedule', async function () {
        await time.setNextBlockTimestamp(delayNotPassed);
        await expectRevert(
          this.accessControl.acceptDefaultAdminTransfer({ from: newDefaultAdmin }),
          `${errorPrefix}: transfer delay not passed`,
        );
      });

      it('should revert if block.timestamp is less than schedule', async function () {
        await expectRevert(
          this.accessControl.acceptDefaultAdminTransfer({ from: newDefaultAdmin }),
          `${errorPrefix}: transfer delay not passed`,
        );
      });
    });
  });

  describe('cancel transfer default admin', function () {
    let delayPassed;

    beforeEach(async function () {
      await this.accessControl.beginDefaultAdminTransfer(newDefaultAdmin, { from: defaultAdmin });
      delayPassed = web3.utils
        .toBN(await time.latest())
        .add(delay)
        .addn(1);
    });

    it('resets pending default admin and schedule', async function () {
      await this.accessControl.cancelDefaultAdminTransfer({ from: defaultAdmin });
      expect(await this.accessControl.defaultAdminTransferSchedule()).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await this.accessControl.pendingDefaultAdmin()).to.equal(constants.ZERO_ADDRESS);

      // Advance until passed delay
      await time.setNextBlockTimestamp(delayPassed);

      // Previous pending default admin should not be able to accept after cancellation.
      await expectRevert(
        this.accessControl.acceptDefaultAdminTransfer({ from: newDefaultAdmin }),
        `${errorPrefix}: pending admin must accept`,
      );
    });

    it('cancels even after delay has passed', async function () {
      await this.accessControl.cancelDefaultAdminTransfer({ from: defaultAdmin });
      await time.setNextBlockTimestamp(delayPassed);
      expect(await this.accessControl.defaultAdminTransferSchedule()).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await this.accessControl.pendingDefaultAdmin()).to.equal(constants.ZERO_ADDRESS);
    });

    it('reverts if called by non default admin accounts', async function () {
      await expectRevert(
        this.accessControl.cancelDefaultAdminTransfer({ from: other }),
        `${errorPrefix}: account ${other.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`,
      );
    });
  });

  describe('renouncing admin', function () {
    let delayPassed;
    let from = defaultAdmin;

    beforeEach(async function () {
      await this.accessControl.beginDefaultAdminTransfer(constants.ZERO_ADDRESS, { from });
      delayPassed = web3.utils
        .toBN(await time.latest())
        .add(delay)
        .addn(1);
    });

    it('it renounces role', async function () {
      await time.setNextBlockTimestamp(delayPassed);
      const receipt = await this.accessControl.renounceRole(DEFAULT_ADMIN_ROLE, from, { from });

      expect(await this.accessControl.hasRole(DEFAULT_ADMIN_ROLE, defaultAdmin)).to.be.false;
      expect(await this.accessControl.hasRole(constants.ZERO_ADDRESS, defaultAdmin)).to.be.false;
      expectEvent(receipt, 'RoleRevoked', {
        role: DEFAULT_ADMIN_ROLE,
        account: from,
      });
      expect(await this.accessControl.owner()).to.equal(constants.ZERO_ADDRESS);
    });

    it('allows to recover access using the internal _grantRole', async function () {
      await time.setNextBlockTimestamp(delayPassed);
      await this.accessControl.renounceRole(DEFAULT_ADMIN_ROLE, from, { from });

      const grantRoleReceipt = await this.accessControl.$_grantRole(DEFAULT_ADMIN_ROLE, other);
      expectEvent(grantRoleReceipt, 'RoleGranted', {
        role: DEFAULT_ADMIN_ROLE,
        account: other,
      });
    });

    it('reverts if caller is not default admin', async function () {
      await time.setNextBlockTimestamp(delayPassed);
      await expectRevert(
        this.accessControl.renounceRole(DEFAULT_ADMIN_ROLE, other, { from }),
        `${errorPrefix}: can only renounce roles for self`,
      );
    });

    describe('schedule not passed', function () {
      let delayNotPassed;

      beforeEach(function () {
        delayNotPassed = delayPassed.subn(1);
      });

      it('reverts if block.timestamp is equal to schedule', async function () {
        await time.setNextBlockTimestamp(delayNotPassed);
        await expectRevert(
          this.accessControl.renounceRole(DEFAULT_ADMIN_ROLE, defaultAdmin, { from }),
          `${errorPrefix}: only can renounce in two delayed steps`,
        );
      });

      it('reverts if block.timestamp is less than schedule', async function () {
        await time.setNextBlockTimestamp(delayNotPassed.subn(1));
        await expectRevert(
          this.accessControl.renounceRole(DEFAULT_ADMIN_ROLE, defaultAdmin, { from }),
          `${errorPrefix}: only can renounce in two delayed steps`,
        );
      });
    });
  });

  describe('scheduling a delay change', function () {
    describe('when no default admin transfer is pending', function () {
      let receipt;
      let newDefaultAdminDelay;
      let defaultAdminDelaySchedule;

      let delayChangeType;

      afterEach('assert expected values', async function () {
        expect(await this.accessControl.defaultAdminDelayChangeSchedule()).to.be.bignumber.eq(
          defaultAdminDelaySchedule,
        );
        expect(await this.accessControl.pendingDefaultAdminDelay()).to.be.bignumber.eq(newDefaultAdminDelay);
        expectEvent(receipt, 'DefaultAdminDelayChangeStarted', {
          newDefaultAdminDelay,
          defaultAdminDelaySchedule,
        });
      });

      for ([newDefaultAdminDelay, delayChangeType] of [
        [web3.utils.toBN(delay), 'equal'],
        [web3.utils.toBN(delay).addn(time.duration.days(1)), 'increased'],
        [web3.utils.toBN(delay).subn(time.duration.days(1)), 'decreased'],
      ]) {
        describe(`when the delay is ${delayChangeType}`, function () {
          it('schedules the delay change to the new delay', async function () {
            // Schedules the change
            receipt = await this.accessControl.scheduleDefaultAdminDelayChange(newDefaultAdminDelay, {
              from: defaultAdmin,
            });

            // Calculate expected values
            const changeDelay = newDefaultAdminDelay.lt(delay) ? delay.sub(newDefaultAdminDelay) : newDefaultAdminDelay;
            const timestamp = web3.utils.toBN(await time.latest());
            defaultAdminDelaySchedule = timestamp.add(changeDelay);
          });

          describe('schedule again', function () {
            for (const [offset, when] of [
              [-1, 'before'],
              [1, 'after'],
            ]) {
              it(`should be able to schedule again ${when} the delay schedule passes`, async function () {
                // First change
                await this.accessControl.scheduleDefaultAdminDelayChange(newDefaultAdminDelay, { from: defaultAdmin });

                // Wait until the schedule with an offset
                const schedule = await this.accessControl.defaultAdminDelayChangeSchedule();
                await time.setNextBlockTimestamp(schedule.toNumber() + offset);

                // Default admin changes its mind and schedules another delay change
                newDefaultAdminDelay = newDefaultAdminDelay.addn(time.duration.days(1));
                receipt = await this.accessControl.scheduleDefaultAdminDelayChange(newDefaultAdminDelay, {
                  from: defaultAdmin,
                });

                // Calculate expected values
                const timestamp = web3.utils.toBN(await time.latest());
                defaultAdminDelaySchedule = timestamp.add(newDefaultAdminDelay);
              });
            }
          });
        });
      }
    });

    it('reverts if another default admin transfer has been scheduled', async function () {
      await this.accessControl.beginDefaultAdminTransfer(other, { from: defaultAdmin });
      await expectRevert(
        this.accessControl.scheduleDefaultAdminDelayChange(time.duration.days(4), {
          from: defaultAdmin,
        }),
        `${errorPrefix}: default admin transfer pending`,
      );
    });

    it('reverts if called by non default admin accounts', async function () {
      await expectRevert(
        this.accessControl.scheduleDefaultAdminDelayChange(time.duration.days(4), {
          from: other,
        }),
        `${errorPrefix}: account ${other.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`,
      );
    });
  });

  describe('cancelling a delay change', function () {
    for (const [offset, when] of [
      [-1, 'before'],
      [1, 'after'],
    ])
      it(`resets pending default admin and schedule ${when} delay change schedule passes`, async function () {
        await this.accessControl.scheduleDefaultAdminDelayChange(time.duration.days(12), { from: defaultAdmin });

        const schedule = await this.accessControl.defaultAdminDelayChangeSchedule();
        await time.setNextBlockTimestamp(schedule.toNumber() + offset);

        await this.accessControl.cancelDefaultAdminDelayChange({ from: defaultAdmin });

        expect(await this.accessControl.pendingDefaultAdminDelay()).to.be.bignumber.eq(web3.utils.toBN(0));
        expect(await this.accessControl.defaultAdminDelayChangeSchedule()).to.be.bignumber.eq(web3.utils.toBN(0));
      });

    it('reverts if called by non default admin accounts', async function () {
      await expectRevert(
        this.accessControl.cancelDefaultAdminDelayChange({ from: other }),
        `${errorPrefix}: account ${other.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`,
      );
    });
  });
}

module.exports = {
  DEFAULT_ADMIN_ROLE,
  shouldBehaveLikeAccessControl,
  shouldBehaveLikeAccessControlEnumerable,
  shouldBehaveLikeAccessControlDefaultAdminRules,
};
