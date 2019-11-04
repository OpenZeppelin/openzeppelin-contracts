const { accounts, load } = require('@openzeppelin/test-env');
const [ sender ] = accounts;

require('@openzeppelin/test-helpers');

const ContextMock = load.truffle('ContextMock');
const ContextMockCaller = load.truffle('ContextMockCaller');

const { shouldBehaveLikeRegularContext } = require('./Context.behavior');

describe('Context', function () {
  beforeEach(async function () {
    this.context = await ContextMock.new();
    this.caller = await ContextMockCaller.new();
  });

  shouldBehaveLikeRegularContext(sender);
});
