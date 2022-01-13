const {
  shouldBehaveLikeAccessControl,
  shouldBehaveLikeAccessControlEnumerable,
} = require('./AccessControl.behavior.js');

const AccessControlMock = artifacts.require('AccessControlEnumerableMock');

contract('AccessControl', function (accounts) {
  beforeEach(async function () {
    this.accessControl = await AccessControlMock.new({ from: accounts[0] });
  });

  shouldBehaveLikeAccessControl('AccessControl', ...accounts);
  shouldBehaveLikeAccessControlEnumerable('AccessControl', ...accounts);
});
