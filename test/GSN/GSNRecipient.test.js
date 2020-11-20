const { balance, BN, constants, ether, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const gsn = require('@openzeppelin/gsn-helpers');
const { setGSNProvider } = require('../helpers/set-gsn-provider');

const { expect } = require('chai');

const GSNRecipientMock = artifacts.require('GSNRecipientMock');
const ContextMockCaller = artifacts.require('ContextMockCaller');

const { shouldBehaveLikeRegularContext } = require('./Context.behavior');

contract('GSNRecipient', function (accounts) {
  const [ payee, sender, newRelayHub ] = accounts;

  before(function () {
    setGSNProvider(GSNRecipientMock, accounts);
    setGSNProvider(ContextMockCaller, accounts);
  });

  beforeEach(async function () {
    this.recipient = await GSNRecipientMock.new();
  });

  it('returns the compatible RelayHub version', async function () {
    expect(await this.recipient.relayHubVersion()).to.equal('1.0.0');
  });

  describe('get/set RelayHub', function () {
    const singletonRelayHub = '0xD216153c06E857cD7f72665E0aF1d7D82172F494';

    it('initially returns the singleton instance address', async function () {
      expect(await this.recipient.getHubAddr()).to.equal(singletonRelayHub);
    });

    it('can be upgraded to a new RelayHub', async function () {
      const { logs } = await this.recipient.upgradeRelayHub(newRelayHub);
      expectEvent.inLogs(logs, 'RelayHubChanged', { oldRelayHub: singletonRelayHub, newRelayHub });
    });

    it('cannot upgrade to the same RelayHub', async function () {
      await expectRevert(
        this.recipient.upgradeRelayHub(singletonRelayHub),
        'GSNRecipient: new RelayHub is the current one',
      );
    });

    it('cannot upgrade to the zero address', async function () {
      await expectRevert(
        this.recipient.upgradeRelayHub(ZERO_ADDRESS), 'GSNRecipient: new RelayHub is the zero address',
      );
    });

    context('with new RelayHub', function () {
      beforeEach(async function () {
        await this.recipient.upgradeRelayHub(newRelayHub);
      });

      it('returns the new instance address', async function () {
        expect(await this.recipient.getHubAddr()).to.equal(newRelayHub);
      });
    });
  });

  context('when called directly', function () {
    beforeEach(async function () {
      this.context = this.recipient; // The Context behavior expects the contract in this.context
      this.caller = await ContextMockCaller.new();
    });

    shouldBehaveLikeRegularContext(sender);
  });

  context('when receiving a relayed call', function () {
    beforeEach(async function () {
      await gsn.fundRecipient(web3, { recipient: this.recipient.address });
    });

    describe('msgSender', function () {
      it('returns the relayed transaction original sender', async function () {
        const { tx } = await this.recipient.msgSender({ from: sender, useGSN: true });
        await expectEvent.inTransaction(tx, GSNRecipientMock, 'Sender', { sender });
      });
    });

    describe('msgData', function () {
      it('returns the relayed transaction original data', async function () {
        const integerValue = new BN('42');
        const stringValue = 'OpenZeppelin';
        const callData = this.recipient.contract.methods.msgData(integerValue.toString(), stringValue).encodeABI();

        // The provider doesn't properly estimate gas for a relayed call, so we need to manually set a higher value
        const { tx } = await this.recipient.msgData(integerValue, stringValue, { gas: 1000000, useGSN: true });
        await expectEvent.inTransaction(tx, GSNRecipientMock, 'Data', { data: callData, integerValue, stringValue });
      });
    });
  });

  context('with deposited funds', async function () {
    const amount = ether('1');

    beforeEach(async function () {
      await gsn.fundRecipient(web3, { recipient: this.recipient.address, amount });
    });

    it('funds can be withdrawn', async function () {
      const balanceTracker = await balance.tracker(payee);
      await this.recipient.withdrawDeposits(amount, payee);
      expect(await balanceTracker.delta()).to.be.bignumber.equal(amount);
    });

    it('partial funds can be withdrawn', async function () {
      const balanceTracker = await balance.tracker(payee);
      await this.recipient.withdrawDeposits(amount.divn(2), payee);
      expect(await balanceTracker.delta()).to.be.bignumber.equal(amount.divn(2));
    });

    it('reverts on overwithdrawals', async function () {
      await expectRevert(this.recipient.withdrawDeposits(amount.addn(1), payee), 'insufficient funds');
    });
  });
});
