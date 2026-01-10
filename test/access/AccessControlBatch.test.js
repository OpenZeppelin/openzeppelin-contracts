const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('AccessControlBatch', function () {
  let contract;
  let admin, user1, user2;

  const ROLE_A = ethers.id('ROLE_A');
  const ROLE_B = ethers.id('ROLE_B');

  beforeEach(async function () {
    [admin, user1, user2] = await ethers.getSigners();

    const Test = await ethers.getContractFactory('AccessControlBatchMock');
    contract = await Test.deploy(admin.address);
  });

  it('grants multiple roles in a single transaction', async function () {
    await contract.connect(admin).grantRoles([ROLE_A, ROLE_B], [user1.address, user2.address]);

    expect(await contract.hasRole(ROLE_A, user1.address)).to.equal(true);
    expect(await contract.hasRole(ROLE_B, user2.address)).to.equal(true);
  });

  it('revokes multiple roles in a single transaction', async function () {
    await contract.connect(admin).grantRoles([ROLE_A, ROLE_B], [user1.address, user2.address]);

    await contract.connect(admin).revokeRoles([ROLE_A, ROLE_B], [user1.address, user2.address]);

    expect(await contract.hasRole(ROLE_A, user1.address)).to.equal(false);
    expect(await contract.hasRole(ROLE_B, user2.address)).to.equal(false);
  });

  it('reverts on length mismatch', async function () {
    await expect(contract.connect(admin).grantRoles([ROLE_A], [user1.address, user2.address])).to.be.revertedWith(
      'AccessControlBatch: length mismatch',
    );
  });

  it('reverts when granting a role to the zero address', async function () {
    await expect(contract.connect(admin).grantRoles([ROLE_A], [ethers.ZeroAddress])).to.be.revertedWith(
      'AccessControlBatch: invalid account',
    );
  });

  it('reverts when revoking a role from the zero address', async function () {
    await expect(contract.connect(admin).revokeRoles([ROLE_A], [ethers.ZeroAddress])).to.be.revertedWith(
      'AccessControlBatch: invalid account',
    );
  });
  it('reverts when roles and accounts length mismatch', async function () {
    await expect(contract.connect(admin).grantRoles([ROLE_A, ROLE_B], [user1.address])).to.be.revertedWith(
      'AccessControlBatch: length mismatch',
    );
  });

  it('reverts when caller is not admin', async function () {
    await expect(contract.connect(user1).grantRoles([ROLE_A], [user1.address])).to.be.reverted;
  });
  it('reverts when revoking roles with length mismatch', async function () {
    await expect(contract.connect(admin).revokeRoles([ROLE_A, ROLE_B], [user1.address])).to.be.revertedWith(
      'AccessControlBatch: length mismatch',
    );
  });
});
