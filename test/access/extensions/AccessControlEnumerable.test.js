const {
  DEFAULT_ADMIN_ROLE,
  shouldBehaveLikeAccessControl,
  shouldBehaveLikeAccessControlEnumerable,
} = require('../AccessControl.behavior.js');

const AccessControlEnumerable = artifacts.require('$AccessControlEnumerable');

contract('AccessControlEnumerable', function (accounts) {
  beforeEach(async function () {
    this.accessControl = await AccessControlEnumerable.new({ from: accounts[0] });
    await this.accessControl.$_grantRole(DEFAULT_ADMIN_ROLE, accounts[0]);
  });

  shouldBehaveLikeAccessControl(...accounts);
  shouldBehaveLikeAccessControlEnumerable(...accounts);
});
