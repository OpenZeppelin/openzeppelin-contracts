const { accounts, load } = require('@openzeppelin/test-env');
const [ sender ] = accounts;

require('@openzeppelin/test-helpers');

const ContextMock = load.truffle.fromArtifacts('ContextMock');
const ContextMockCaller = load.truffle.fromArtifacts('ContextMockCaller');

const { shouldBehaveLikeRegularContext } = require('./Context.behavior');

describe('Context', function () {
  beforeEach(async function () {
    this.context = await ContextMock.new();
    this.caller = await ContextMockCaller.new();
  });

  shouldBehaveLikeRegularContext(sender);
});
