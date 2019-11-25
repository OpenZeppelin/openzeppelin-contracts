const { accounts, contract } = require('@openzeppelin/test-environment');

require('@openzeppelin/test-helpers');

const ContextMock = contract.fromArtifact('ContextMock');
const ContextMockCaller = contract.fromArtifact('ContextMockCaller');

const { shouldBehaveLikeRegularContext } = require('./Context.behavior');

describe('Context', function () {
  const [ sender ] = accounts;

  beforeEach(async function () {
    this.context = await ContextMock.new();
    this.caller = await ContextMockCaller.new();
  });

  shouldBehaveLikeRegularContext(sender);
});
