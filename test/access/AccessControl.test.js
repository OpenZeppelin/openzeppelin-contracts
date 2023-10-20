const { ethers } = require('hardhat');
const {
  DEFAULT_ADMIN_ROLE,
  accessControlAccountsBaseFixture,
  shouldBehaveLikeAccessControl,
} = require('./AccessControl.behavior.js');

const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const { accounts } = await accessControlAccountsBaseFixture();
  const mock = await ethers.deployContract('$AccessControl');
  const defaultAdmin = accounts.shift();
  await mock.$_grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin.address);
  return { mock, defaultAdmin, accounts };
}

describe('AccessControl', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeAccessControl();
});
