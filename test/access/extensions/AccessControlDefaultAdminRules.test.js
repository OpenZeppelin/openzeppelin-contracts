const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const time = require('../../helpers/time');

const {
  shouldBehaveLikeAccessControl,
  shouldBehaveLikeAccessControlDefaultAdminRules,
} = require('../AccessControl.behavior');

async function fixture() {
  const delay = time.duration.hours(10);
  const [defaultAdmin, ...accounts] = await ethers.getSigners();
  const mock = await ethers.deployContract('$AccessControlDefaultAdminRules', [delay, defaultAdmin]);
  return { mock, defaultAdmin, delay, accounts };
}

describe('AccessControlDefaultAdminRules', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('initial admin not zero', async function () {
    await expect(ethers.deployContract('$AccessControlDefaultAdminRules', [this.delay, ethers.ZeroAddress]))
      .to.be.revertedWithCustomError(this.mock, 'AccessControlInvalidDefaultAdmin')
      .withArgs(ethers.ZeroAddress);
  });

  shouldBehaveLikeAccessControl();
  shouldBehaveLikeAccessControlDefaultAdminRules();
});
