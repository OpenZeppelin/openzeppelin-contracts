const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { DEFAULT_ADMIN_ROLE, shouldBehaveLikeAccessControl } = require('./AccessControl.behavior.js');

async function fixture() {
  const [defaultAdmin, ...accounts] = await ethers.getSigners();
  const mock = await ethers.deployContract('$AccessControl');
  await mock.$_grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
  return { mock, defaultAdmin, accounts };
}

describe('AccessControl', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeAccessControl();
});
