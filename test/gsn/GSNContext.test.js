const { BN, expectEvent } = require('openzeppelin-test-helpers');
const gsn = require('@openzeppelin/gsn-helpers');

const GSNContextMock = artifacts.require('GSNContextMock');
const ContextMockCaller = artifacts.require('ContextMockCaller');

const { shouldBehaveLikeRegularContext } = require('./Context.behavior');

contract('GSNContext', function ([_, deployer, sender]) {
  beforeEach(async function () {
    this.context = await GSNContextMock.new();
    this.caller = await ContextMockCaller.new();
  });

  context('when called directly', function () {
    shouldBehaveLikeRegularContext(sender);
  });

  context('when receiving a relayed call', function () {
    beforeEach(async function () {
      await gsn.fundRecipient(web3, { recipient: this.context.address });
    });

    describe('msgSender', function () {
      it('returns the relayed transaction original sender', async function () {
        const { tx } = await this.context.msgSender({ from: sender, useGSN: true });
        await expectEvent.inTransaction(tx, GSNContextMock, 'Sender', { sender });
      });
    });

    describe('msgData', function () {
      it('returns the relayed transaction original data', async function () {
        const integerValue = new BN('42');
        const stringValue = 'OpenZeppelin';
        const callData = this.context.contract.methods.msgData(integerValue.toString(), stringValue).encodeABI();

        // The provider doesn't properly estimate gas for a relayed call, so we need to manually set a higher value
        const { tx } = await this.context.msgData(integerValue, stringValue, { gas: 100000, useGSN: true });
        await expectEvent.inTransaction(tx, GSNContextMock, 'Data', { data: callData, integerValue, stringValue });
      });
    });
  });
});
