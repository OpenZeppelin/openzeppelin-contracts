const { accounts, contract } = require('@openzeppelin/test-environment');
const [ sender ] = accounts;

require('@openzeppelin/test-helpers');

const ContextMock = contract.fromArtifact('ContextMock');
const ContextMockCaller = contract.fromArtifact('ContextMockCaller');

const { shouldBehaveLikeRegularContext } = require('./Context.behavior');

describe('Context', function () {
  beforeEach(async function () {
    this.context = await ContextMock.new();
    this.caller = await ContextMockCaller.new();
  });

  shouldBehaveLikeRegularContext(sender);
});
