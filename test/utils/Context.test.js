require('@openzeppelin/test-helpers');

const ContextMock = artifacts.require('ContextMock');
const ContextMockCaller = artifacts.require('ContextMockCaller');

const { shouldBehaveLikeRegularContext } = require('./Context.behavior');

contract('Context', function (accounts) {
  const [sender] = accounts;

  beforeEach(async function () {
    this.context = await ContextMock.new();
    this.caller = await ContextMockCaller.new();
  });

  shouldBehaveLikeRegularContext(sender);
});
