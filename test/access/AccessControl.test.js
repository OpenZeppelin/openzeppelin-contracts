const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const AccessControlMock = contract.fromArtifact('AccessControlMock');

describe('AccessControl', function () {
  const [ admin, authorized, otherAuthorized, other ] = accounts;

  const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const ROLE = web3.utils.soliditySha3('ROLE');
  const OTHER_ROLE = web3.utils.soliditySha3('OTHER_ROLE');

  beforeEach(async function () {
    this.accessControl = await AccessControlMock.new({ from: admin });
  });

  describe('default admin', function () {
    it('deployer has default admin role', async function () {
      expect(await this.accessControl.hasRole(DEFAULT_ADMIN_ROLE, admin)).to.equal(true);
    });

    it('other roles\'s admin is the default admin role', async function () {
      expect(await this.accessControl.getRoleAdmin(ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
    });

    it('default admin role\'s admin is itself', async function () {
      expect(await this.accessControl.getRoleAdmin(DEFAULT_ADMIN_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
    });
  });

  describe('granting', function () {
    it('admin can grant role to other accounts', async function () {
      const receipt = await this.accessControl.grantRole(ROLE, authorized, { from: admin });
      expectEvent(receipt, 'RoleGranted', { account: authorized, roleId: ROLE });

      expect(await this.accessControl.hasRole(ROLE, authorized)).to.equal(true);
    });

    it('non-admin cannot grant role to other accounts', async function () {
      await expectRevert(
        this.accessControl.grantRole(ROLE, authorized, { from: other }),
        'AccessControl: sender must be an admin to grant'
      );
    });

    it('accounts can be granted a role multiple times', async function () {
      await this.accessControl.grantRole(ROLE, authorized, { from: admin });
      const receipt = await this.accessControl.grantRole(ROLE, authorized, { from: admin });
      expectEvent(receipt, 'RoleGranted', { account: authorized, roleId: ROLE });
    });
  });

  describe('revoking', function () {
    it('roles that are not had can be revoked', async function () {
      expect(await this.accessControl.hasRole(ROLE, authorized)).to.equal(false);

      const receipt = await this.accessControl.revokeRole(ROLE, authorized, { from: admin });
      expectEvent(receipt, 'RoleRevoked', { account: authorized, roleId: ROLE });
    });

    context('with granted role', function () {
      beforeEach(async function () {
        await this.accessControl.grantRole(ROLE, authorized, { from: admin });
      });

      it('admin can revoke role', async function () {
        const receipt = await this.accessControl.revokeRole(ROLE, authorized, { from: admin });
        expectEvent(receipt, 'RoleRevoked', { account: authorized, roleId: ROLE });

        expect(await this.accessControl.hasRole(ROLE, authorized)).to.equal(false);
      });

      it('non-admin cannot revoke role', async function () {
        await expectRevert(
          this.accessControl.revokeRole(ROLE, authorized, { from: other }),
          'AccessControl: sender must be an admin to revoke'
        );
      });

      it('a role can be revoked multiple times', async function () {
        await this.accessControl.revokeRole(ROLE, authorized, { from: admin });

        const receipt = await this.accessControl.revokeRole(ROLE, authorized, { from: admin });
        expectEvent(receipt, 'RoleRevoked', { account: authorized, roleId: ROLE });
      });
    });
  });

  describe('renouncing', function () {
    it('roles that are not had can be renounced', async function () {
      const receipt = await this.accessControl.renounceRole(ROLE, authorized, { from: authorized });
      expectEvent(receipt, 'RoleRevoked', { account: authorized, roleId: ROLE });
    });

    context('with granted role', function () {
      beforeEach(async function () {
        await this.accessControl.grantRole(ROLE, authorized, { from: admin });
      });

      it('bearer can renounce role', async function () {
        const receipt = await this.accessControl.renounceRole(ROLE, authorized, { from: authorized });
        expectEvent(receipt, 'RoleRevoked', { account: authorized, roleId: ROLE });

        expect(await this.accessControl.hasRole(ROLE, authorized)).to.equal(false);
      });

      it('only the sender can renounce their roles', async function () {
        await expectRevert(
          this.accessControl.renounceRole(ROLE, authorized, { from: admin }),
          'AccessControl: can only renounce roles for self'
        );
      });

      it('a role can be renounced multiple times', async function () {
        await this.accessControl.renounceRole(ROLE, authorized, { from: authorized });

        const receipt = await this.accessControl.renounceRole(ROLE, authorized, { from: authorized });
        expectEvent(receipt, 'RoleRevoked', { account: authorized, roleId: ROLE });
      });
    });
  });

  describe('enumerating', function () {
    it('role bearers can be enumerated', async function () {
      await this.accessControl.grantRole(ROLE, authorized, { from: admin });
      await this.accessControl.grantRole(ROLE, otherAuthorized, { from: admin });

      const memberCount = await this.accessControl.getRoleMembersCount(ROLE);
      expect(memberCount).to.bignumber.equal('2');

      let bearers = [];
      for (let i = 0; i < memberCount; ++i) {
        bearers.push(await this.accessControl.getRoleMember(ROLE, i));
      }

      expect(bearers).to.have.members([authorized, otherAuthorized]);
    });
  });

  describe('setting role admin', function () {
    it('a role\'s admin role can be changed', async function () {
      await this.accessControl.setRoleAdmin(ROLE, OTHER_ROLE);

      expect(await this.accessControl.getRoleAdmin(ROLE)).to.equal(OTHER_ROLE);
    });

    it('a role\'s previous admins no longer control it', async function () {
      await this.accessControl.setRoleAdmin(ROLE, OTHER_ROLE);

      await expectRevert(
        this.accessControl.grantRole(ROLE, authorized, { from: admin }),
        'AccessControl: sender must be an admin to grant'
      );
    });
  });
});
