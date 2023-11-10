function shouldBehaveLikeRegularContext() {
  describe('msgSender', function () {
    it('returns the transaction sender when called from an EOA', async function () {
      await expect(this.context.connect(this.sender).msgSender())
        .to.emit(this.context, 'Sender')
        .withArgs(this.sender.address);
    });

    it('returns the transaction sender when called from another contract', async function () {
      await expect(this.caller.connect(this.sender).callSender(this.context))
        .to.emit(this.context, 'Sender')
        .withArgs(this.caller.target);
    });
  });

  describe('msgData', function () {
    const integerValue = 42n;
    const stringValue = 'OpenZeppelin';

    let callData;

    beforeEach(async function () {
      callData = this.context.interface.encodeFunctionData(this.context.msgData.fragment, [integerValue, stringValue]);
    });

    it('returns the transaction data when called from an EOA', async function () {
      await expect(this.context.msgData(integerValue, stringValue))
        .to.emit(this.context, 'Data')
        .withArgs(callData, integerValue, stringValue);
    });

    it('returns the transaction sender when from another contract', async function () {
      await expect(this.caller.callData(this.context, integerValue, stringValue))
        .to.emit(this.context, 'Data')
        .withArgs(callData, integerValue, stringValue);
    });
  });
}

module.exports = {
  shouldBehaveLikeRegularContext,
};
