const { BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;
const gsn = require('@openzeppelin/gsn-helpers');

const GSNContextMock = artifacts.require('GSNContextMock');
const ContextMockCaller = artifacts.require('ContextMockCaller');

const { shouldBehaveLikeRegularContext } = require('./Context.behavior');

contract('GSNContext', function ([_, deployer, sender, newRelayHub]) {
  beforeEach(async function () {
    this.context = await GSNContextMock.new();
    this.caller = await ContextMockCaller.new();
  });

  describe('get/set RelayHub', function () {
    const singletonRelayHub = '0xD216153c06E857cD7f72665E0aF1d7D82172F494';

    it('initially returns the singleton instance address', async function () {
      expect(await this.context.getRelayHub()).to.equal(singletonRelayHub);
    });

    it('can be upgraded to a new RelayHub', async function () {
      const { logs } = await this.context.upgradeRelayHub(newRelayHub);
      expectEvent.inLogs(logs, 'RelayHubChanged', { oldRelayHub: singletonRelayHub, newRelayHub });
    });

    it('cannot upgrade to the same RelayHub', async function () {
      await expectRevert(
        this.context.upgradeRelayHub(singletonRelayHub),
        'GSNContext: new RelayHub is the current one'
      );
    });

    it('cannot upgrade to the zero address', async function () {
      await expectRevert(this.context.upgradeRelayHub(ZERO_ADDRESS), 'GSNContext: new RelayHub is the zero address');
    });

    context('with new RelayHub', function () {
      beforeEach(async function () {
        await this.context.upgradeRelayHub(newRelayHub);
      });

      it('returns the new instance address', async function () {
        expect(await this.context.getRelayHub()).to.equal(newRelayHub);
      });
    });
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
