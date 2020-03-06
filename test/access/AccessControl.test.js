const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const { expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const AccessControlMock = contract.fromArtifact('AccessControlMock');

describe('AccessControl', function () {
  const [ defaultAdmin, authorized, other ] = accounts;

  const DEFAULT_ADMIN_ROLE_ID = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const OTHER_ROLE_ID = web3.utils.soliditySha3('OTHER_ROLE_ID');

  beforeEach(async function () {
    this.accessControl = await AccessControlMock.new({ from: defaultAdmin });
  });

  describe('default admin', function () {
    it('deployer has default admin role', async function () {
      expect(await this.accessControl.hasRole(DEFAULT_ADMIN_ROLE_ID, defaultAdmin)).to.equal(true);
    });

    it('other roles admin\'s is the default admin role', async function () {
      expect(await this.accessControl.getRoleAdmin(OTHER_ROLE_ID)).to.equal(DEFAULT_ADMIN_ROLE_ID);
    });

    it('default admin role\'s admin is itself', async function () {
      expect(await this.accessControl.getRoleAdmin(DEFAULT_ADMIN_ROLE_ID)).to.equal(DEFAULT_ADMIN_ROLE_ID);
    });
  });

  describe('granting', function () {
    it('admin can grant role to other accounts', async function () {
      await this.accessControl.grantRole(OTHER_ROLE_ID, authorized, { from: defaultAdmin });
      expect(await this.accessControl.hasRole(OTHER_ROLE_ID, authorized)).to.equal(true);
    });

    it('non-admin cannot grant role to other accounts', async function () {
      await expectRevert(
        this.accessControl.grantRole(OTHER_ROLE_ID, authorized, { from: other }),
        'AccessControl: sender must be an admin to grant'
      );
    });

    it('accounts with a role cannot have it granted', async function () {
      await this.accessControl.grantRole(OTHER_ROLE_ID, authorized, { from: defaultAdmin });
      await expectRevert(
        this.accessControl.grantRole(OTHER_ROLE_ID, authorized, { from: defaultAdmin }),
        'AccessControl: account already has granted role'
      );
    });
  });

  describe('revoking', function () {
    it('roles that are not had cannot be revoked', async function () {
      await expectRevert(
        this.accessControl.revokeRole(OTHER_ROLE_ID, authorized, { from: defaultAdmin }),
        'AccessControl: account does not have revoked role'
      );
    });

    context('with granted role', function () {
      beforeEach(async function () {
        await this.accessControl.grantRole(OTHER_ROLE_ID, authorized, { from: defaultAdmin });
      });

      it('admin can revoke role', async function () {
        await this.accessControl.revokeRole(OTHER_ROLE_ID, authorized, { from: defaultAdmin });
        expect(await this.accessControl.hasRole(OTHER_ROLE_ID, authorized)).to.equal(false);
      });

      it('non-admin cannot revoke role', async function () {
        await expectRevert(
          this.accessControl.revokeRole(OTHER_ROLE_ID, authorized, { from: other }),
          'AccessControl: sender must be an admin to revoke'
        );
      });

      it('a role cannot be revoked multiple times', async function () {
        await this.accessControl.revokeRole(OTHER_ROLE_ID, authorized, { from: defaultAdmin });
        await expectRevert(
          this.accessControl.revokeRole(OTHER_ROLE_ID, authorized, { from: defaultAdmin }),
          'AccessControl: account does not have revoked role'
        );
      });
    });
  });

  describe('renouncing', function () {
    it('roles that are not had cannot be renounced', async function () {
      await expectRevert(
        this.accessControl.renounceRole(OTHER_ROLE_ID, authorized, { from: authorized }),
        'AccessControl: account does not have revoked role'
      );
    });

    context('with granted role', function () {
      beforeEach(async function () {
        await this.accessControl.grantRole(OTHER_ROLE_ID, authorized, { from: defaultAdmin });
      });

      it('bearer can renounce role', async function () {
        await this.accessControl.renounceRole(OTHER_ROLE_ID, authorized, { from: authorized });
        expect(await this.accessControl.hasRole(OTHER_ROLE_ID, authorized)).to.equal(false);
      });

      it('only the sender can renounce their roles', async function () {
        await expectRevert(
          this.accessControl.renounceRole(OTHER_ROLE_ID, authorized, { from: defaultAdmin }),
          'AccessControl: can only renounce roles for self'
        );
      });

      it('a role cannot be renounced multiple times', async function () {
        await this.accessControl.renounceRole(OTHER_ROLE_ID, authorized, { from: authorized });
        await expectRevert(
          this.accessControl.renounceRole(OTHER_ROLE_ID, authorized, { from: authorized }),
          'AccessControl: account does not have revoked role'
        );
      });
    });
  });
});
