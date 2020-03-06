const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const AccessControlMock = contract.fromArtifact('AccessControlMock');

describe('AccessControl', function () {
  const [ defaultAdmin, authorized, other ] = accounts;

  const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const OTHER_ROLE = web3.utils.soliditySha3('OTHER_ROLE');

  beforeEach(async function () {
    this.accessControl = await AccessControlMock.new({ from: defaultAdmin });
  });

  describe('default admin', function () {
    it('deployer has default admin role', async function () {
      expect(await this.accessControl.hasRole(DEFAULT_ADMIN_ROLE, defaultAdmin)).to.equal(true);
    });

    it('other roles\'s admin is the default admin role', async function () {
      expect(await this.accessControl.getRoleAdmin(OTHER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
    });

    it('default admin role\'s admin is itself', async function () {
      expect(await this.accessControl.getRoleAdmin(DEFAULT_ADMIN_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
    });
  });

  describe('granting', function () {
    it('admin can grant role to other accounts', async function () {
      const receipt = await this.accessControl.grantRole(OTHER_ROLE, authorized, { from: defaultAdmin });
      expectEvent(receipt, 'RoleGranted', { account: authorized, roleId: OTHER_ROLE });

      expect(await this.accessControl.hasRole(OTHER_ROLE, authorized)).to.equal(true);
    });

    it('non-admin cannot grant role to other accounts', async function () {
      await expectRevert(
        this.accessControl.grantRole(OTHER_ROLE, authorized, { from: other }),
        'AccessControl: sender must be an admin to grant'
      );
    });

    it('accounts can be granted a role multiple times', async function () {
      await this.accessControl.grantRole(OTHER_ROLE, authorized, { from: defaultAdmin });
      const receipt = await this.accessControl.grantRole(OTHER_ROLE, authorized, { from: defaultAdmin });
      expectEvent(receipt, 'RoleGranted', { account: authorized, roleId: OTHER_ROLE });
    });
  });

  describe('revoking', function () {
    it('roles that are not had can be revoked', async function () {
      expect(await this.accessControl.hasRole(OTHER_ROLE, authorized)).to.equal(false);

      const receipt = await this.accessControl.revokeRole(OTHER_ROLE, authorized, { from: defaultAdmin });
      expectEvent(receipt, 'RoleRevoked', { account: authorized, roleId: OTHER_ROLE });
    });

    context('with granted role', function () {
      beforeEach(async function () {
        await this.accessControl.grantRole(OTHER_ROLE, authorized, { from: defaultAdmin });
      });

      it('admin can revoke role', async function () {
        const receipt = await this.accessControl.revokeRole(OTHER_ROLE, authorized, { from: defaultAdmin });
        expectEvent(receipt, 'RoleRevoked', { account: authorized, roleId: OTHER_ROLE });

        expect(await this.accessControl.hasRole(OTHER_ROLE, authorized)).to.equal(false);
      });

      it('non-admin cannot revoke role', async function () {
        await expectRevert(
          this.accessControl.revokeRole(OTHER_ROLE, authorized, { from: other }),
          'AccessControl: sender must be an admin to revoke'
        );
      });

      it('a role can be revoked multiple times', async function () {
        await this.accessControl.revokeRole(OTHER_ROLE, authorized, { from: defaultAdmin });

        const receipt = await this.accessControl.revokeRole(OTHER_ROLE, authorized, { from: defaultAdmin });
        expectEvent(receipt, 'RoleRevoked', { account: authorized, roleId: OTHER_ROLE });
      });
    });
  });

  describe('renouncing', function () {
    it('roles that are not had can be renounced', async function () {
      const receipt = await this.accessControl.renounceRole(OTHER_ROLE, authorized, { from: authorized });
      expectEvent(receipt, 'RoleRevoked', { account: authorized, roleId: OTHER_ROLE });
    });

    context('with granted role', function () {
      beforeEach(async function () {
        await this.accessControl.grantRole(OTHER_ROLE, authorized, { from: defaultAdmin });
      });

      it('bearer can renounce role', async function () {
        const receipt = await this.accessControl.renounceRole(OTHER_ROLE, authorized, { from: authorized });
        expectEvent(receipt, 'RoleRevoked', { account: authorized, roleId: OTHER_ROLE });

        expect(await this.accessControl.hasRole(OTHER_ROLE, authorized)).to.equal(false);
      });

      it('only the sender can renounce their roles', async function () {
        await expectRevert(
          this.accessControl.renounceRole(OTHER_ROLE, authorized, { from: defaultAdmin }),
          'AccessControl: can only renounce roles for self'
        );
      });

      it('a role can be renounced multiple times', async function () {
        await this.accessControl.renounceRole(OTHER_ROLE, authorized, { from: authorized });

        const receipt = await this.accessControl.renounceRole(OTHER_ROLE, authorized, { from: authorized });
        expectEvent(receipt, 'RoleRevoked', { account: authorized, roleId: OTHER_ROLE });
      });
    });
  });
});
