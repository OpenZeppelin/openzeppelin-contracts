const {
  shouldBehaveLikeAccessControl,
  shouldBehaveLikeAccessControlDefaultAdminRules,
  accessControlAccountsBaseFixture,
} = require('../AccessControl.behavior.js');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ethers } = require('hardhat');
const time = require('../../helpers/time.js');
const { ZeroAddress: ZERO_ADDRESS } = require('ethers');

async function fixture() {
  const delay = time.duration.hours(10);
  const {
    accounts: [defaultAdmin, ...accounts],
  } = await accessControlAccountsBaseFixture();
  const mock = await ethers.deployContract('$AccessControlDefaultAdminRules', [delay, defaultAdmin.address]);
  return { mock, defaultAdmin, delay, accounts };
}

describe('AccessControlDefaultAdminRules', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('initial admin not zero', async function () {
    await expect(ethers.deployContract('$AccessControlDefaultAdminRules', [this.delay, ZERO_ADDRESS]))
      .to.be.revertedWithCustomError(this.mock, 'AccessControlInvalidDefaultAdmin')
      .withArgs(ZERO_ADDRESS);
  });

  shouldBehaveLikeAccessControl();
  shouldBehaveLikeAccessControlDefaultAdminRules();
});
