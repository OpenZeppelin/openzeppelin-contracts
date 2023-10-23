const { ethers } = require('hardhat');
const {
  DEFAULT_ADMIN_ROLE,
  accessControlAccountsBaseFixture,
  shouldBehaveLikeAccessControl,
  shouldBehaveLikeAccessControlEnumerable,
} = require('../AccessControl.behavior.js');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const {
    accounts: [defaultAdmin, ...accounts],
  } = await accessControlAccountsBaseFixture();
  const mock = await ethers.deployContract('$AccessControlEnumerable');
  await mock.$_grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin.address);
  return { mock, defaultAdmin, accounts };
}

contract('AccessControlEnumerable', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeAccessControl();
  shouldBehaveLikeAccessControlEnumerable();
});
