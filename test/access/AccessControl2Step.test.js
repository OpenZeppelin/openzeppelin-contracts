const { shouldBehaveLikeAccessControl2Step } = require('./AccessControl2Step.behavior.js');

const AccessControl2StepMock = artifacts.require('AccessControl2StepMock');

contract('AccessControl2StepMock', function (accounts) {
  beforeEach(async function () {
    this.accessControl2Step = await AccessControl2StepMock.new({ from: accounts[0] });
  });

  shouldBehaveLikeAccessControl2Step('AccessControl', ...accounts);
});
