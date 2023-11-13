const { ethers } = require('hardhat');
const { expect } = require('chai');

function shouldBehaveLikeRegularContext() {
  beforeEach(async function () {
    this.contextHelper = await ethers.deployContract('ContextMockCaller', []);
  });

  describe('msgSender', function () {
    it('returns the transaction sender when called from an EOA', async function () {
      expect(this.context.connect(this.sender).msgSender())
        .to.emit(this.context, 'Sender')
        .withArgs(this.sender.address);
    });

    it('returns the transaction sender when from another contract', async function () {
      await expect(this.contextHelper.connect(this.sender).callSender(this.context))
        .to.emit(this.context, 'Sender')
        .withArgs(this.contextHelper.target);
    });
  });

  describe('msgData', function () {
    const args = [42n, 'OpenZeppelin'];

    it('returns the transaction data when called from an EOA', async function () {
      const data = this.context.interface.encodeFunctionData('msgData', args);

      await expect(this.context.msgData(...args))
        .to.emit(this.context, 'Data')
        .withArgs(data, ...args);
    });

    it('returns the transaction sender when from another contract', async function () {
      const data = this.context.interface.encodeFunctionData('msgData', args);

      await expect(this.contextHelper.callData(this.context, ...args))
        .to.emit(this.context, 'Data')
        .withArgs(data, ...args);
    });
  });
}

module.exports = {
  shouldBehaveLikeRegularContext,
};
