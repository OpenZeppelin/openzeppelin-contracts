const { time, constants, expectRevert } = require('@openzeppelin/test-helpers');
const {
  shouldBehaveLikeAccessControl,
  shouldBehaveLikeAccessControlDefaultAdminRules,
} = require('../AccessControl.behavior.js');

const AccessControlDefaultAdminRules = artifacts.require('$AccessControlDefaultAdminRules');

contract('AccessControlDefaultAdminRules', function (accounts) {
  const delay = web3.utils.toBN(time.duration.hours(10));

  beforeEach(async function () {
    this.accessControl = await AccessControlDefaultAdminRules.new(delay, accounts[0], { from: accounts[0] });
  });

  it('initial admin not zero', async function () {
    await expectRevert(
      AccessControlDefaultAdminRules.new(delay, constants.ZERO_ADDRESS),
      'AccessControlInvalidDefaultAdmin',
      [constants.ZERO_ADDRESS],
    );
  });

  shouldBehaveLikeAccessControl(...accounts);
  shouldBehaveLikeAccessControlDefaultAdminRules(delay, ...accounts);
});
