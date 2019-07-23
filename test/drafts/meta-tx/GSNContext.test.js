const { singletons } = require('openzeppelin-test-helpers');

const GSNContextMock = artifacts.require('GSNContextMock');
const ContextMockCaller = artifacts.require('ContextMockCaller');

const { shouldBehaveLikeRegularContext } = require('./Context.behavior');

contract('GSNContext', function ([_, deployer, sender, rhub]) {
  beforeEach(async function () {
    this.context = await GSNContextMock.new(rhub);
    this.caller = await ContextMockCaller.new();
  });

  context('when called directly', function () {
    shouldBehaveLikeRegularContext(sender);
  });

  context('when receiving a relayed call', function () {
    beforeEach(async function () {
      this.relayHub = await singletons.RelayHub(deployer);
    });
  });
});
