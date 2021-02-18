const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const { shouldBehaveLikeAccessControl } = require('./AccessControl.behavior.js');

const AccessControlMock = artifacts.require('AccessControlMock');

contract('AccessControl', function (accounts) {

  beforeEach(async function () {
    this.accessControl = await AccessControlMock.new({ from: accounts[0] });
  });

  shouldBehaveLikeAccessControl('AccessControl', ...accounts);
});
