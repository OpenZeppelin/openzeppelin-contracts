const { time } = require('@openzeppelin/test-helpers');
const {
  shouldBehaveLikeAccessControl,
  shouldBehaveLikeAccessControlAdminRules,
} = require('./AccessControl.behavior.js');

const AccessControlAdminRules = artifacts.require('$AccessControlAdminRules');

contract('AccessControlAdminRules', function (accounts) {
  const delay = web3.utils.toBN(time.duration.days(10));

  beforeEach(async function () {
    this.accessControl = await AccessControlAdminRules.new(delay, accounts[0], { from: accounts[0] });
  });

  shouldBehaveLikeAccessControl('AccessControl', ...accounts);
  shouldBehaveLikeAccessControlAdminRules('AccessControl', delay, ...accounts);
});
