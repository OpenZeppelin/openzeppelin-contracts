const { BN, ether, expectEvent, singletons } = require('openzeppelin-test-helpers');
const convertToGSN = require('../../helpers/convertToGSN');

const GSNContextMock = artifacts.require('GSNContextMock');
const ContextMockCaller = artifacts.require('ContextMockCaller');

const { shouldBehaveLikeRegularContext } = require('./Context.behavior');

contract('GSNContext', function ([_, deployer, sender]) {
  before(async function () {
    this.relayHub = await singletons.RelayHub(deployer);
  });

  beforeEach(async function () {
    this.context = await GSNContextMock.new(this.relayHub.address);
    this.caller = await ContextMockCaller.new();
  });

  context('when called directly', function () {
    shouldBehaveLikeRegularContext(sender);
  });

  context('when receiving a relayed call', function () {
    beforeEach(async function () {
      this.context = await convertToGSN(this.context);
      await this.relayHub.depositFor(this.context.address, { from: deployer, value: ether('1') });
    });

    describe('msgSender', function () {
      it('returns the relayed transaction original sender', async function () {
        const { tx } = await this.context.msgSender({ from: sender });
        await expectEvent.inTransaction(tx, GSNContextMock, 'Sender', { sender });
      });
    });

    describe('msgData', function () {
      it('returns the relayed transaction original data', async function () {
        const integerValue = new BN('42');
        const stringValue = 'OpenZeppelin';
        const callData = this.context.contract.methods.msgData(integerValue.toString(), stringValue).encodeABI();

        // The provider doesn't properly estimate gas for a relayed call, so we need to manually set a higher value
        const { tx } = await this.context.msgData(integerValue, stringValue, { gas: 100000 });
        await expectEvent.inTransaction(tx, GSNContextMock, 'Data', { data: callData, integerValue, stringValue });
      });
    });
  });
});
