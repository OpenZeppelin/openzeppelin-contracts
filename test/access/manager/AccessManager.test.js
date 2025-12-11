const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { buildBaseRoles } = require('../../helpers/access-manager');
const { shouldBehaveLikeAccessManager } = require('./AccessManager.behavior');

async function fixture() {
  const [admin, roleAdmin, roleGuardian, member, user, other] = await ethers.getSigners();

  // Build roles
  const roles = buildBaseRoles();

  // Add members
  roles.ADMIN.members = [admin];
  roles.SOME_ADMIN.members = [roleAdmin];
  roles.SOME_GUARDIAN.members = [roleGuardian];
  roles.SOME.members = [member];
  roles.PUBLIC.members = [admin, roleAdmin, roleGuardian, member, user, other];

  const manager = await ethers.deployContract('$AccessManagerMock', [admin]);
  const target = await ethers.deployContract('$AccessManagedTarget', [manager]);

  for (const { id: roleId, admin, guardian, members } of Object.values(roles)) {
    if (roleId === roles.PUBLIC.id) continue; // Every address belong to public and is locked
    if (roleId === roles.ADMIN.id) continue; // Admin set during construction and is locked

    // Set admin role avoiding default
    if (admin.id !== roles.ADMIN.id) {
      await manager.$_setRoleAdmin(roleId, admin.id);
    }

    // Set guardian role avoiding default
    if (guardian.id !== roles.ADMIN.id) {
      await manager.$_setRoleGuardian(roleId, guardian.id);
    }

    // Grant role to members
    for (const member of members) {
      await manager.$_grantRole(roleId, member, 0, 0);
    }
  }

  return {
    admin,
    roleAdmin,
    user,
    other,
    roles,
    manager,
    target,
  };
}

describe('AccessManager', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeAccessManager();
});
