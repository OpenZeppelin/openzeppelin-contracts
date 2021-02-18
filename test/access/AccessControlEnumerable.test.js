const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const {
  shouldBehaveLikeAccessControl,
  shouldBehaveLikeAccessControlEnumerable,
  shouldBehaveLikeAccessControlEnumerable2,
} = require('./AccessControl.behavior.js');

const AccessControlMock = artifacts.require('AccessControlEnumerableMock');

contract('AccessControl', function (accounts) {

  beforeEach(async function () {
    this.accessControl = await AccessControlMock.new({ from: accounts[0] });
  });

  shouldBehaveLikeAccessControl('AccessControl', ...accounts);
  shouldBehaveLikeAccessControlEnumerable('AccessControl', ...accounts);
  shouldBehaveLikeAccessControlEnumerable2('AccessControl', ...accounts);
});
