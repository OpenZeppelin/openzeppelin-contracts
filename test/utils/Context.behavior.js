const { BN, expectEvent } = require('@openzeppelin/test-helpers');

const ContextMock = artifacts.require('ContextMock');

function shouldBehaveLikeRegularContext (sender) {
  describe('msgSender', function () {
    it('returns the transaction sender when called from an EOA', async function () {
      const receipt = await this.context.msgSender({ from: sender });
      expectEvent(receipt, 'Sender', { sender });
    });

    it('returns the transaction sender when from another contract', async function () {
      const { tx } = await this.caller.callSender(this.context.address, { from: sender });
      await expectEvent.inTransaction(tx, ContextMock, 'Sender', { sender: this.caller.address });
    });
  });

  describe('msgData', function () {
    const integerValue = new BN('42');
    const stringValue = 'OpenZeppelin';

    let callData;

    beforeEach(async function () {
      callData = this.context.contract.methods.msgData(integerValue.toString(), stringValue).encodeABI();
    });

    it('returns the transaction data when called from an EOA', async function () {
      const receipt = await this.context.msgData(integerValue, stringValue);
      expectEvent(receipt, 'Data', { data: callData, integerValue, stringValue });
    });

    it('returns the transaction sender when from another contract', async function () {
      const { tx } = await this.caller.callData(this.context.address, integerValue, stringValue);
      await expectEvent.inTransaction(tx, ContextMock, 'Data', { data: callData, integerValue, stringValue });
    });
  });
}

module.exports = {
  shouldBehaveLikeRegularContext,
};
