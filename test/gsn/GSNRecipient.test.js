const { balance, ether, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const gsn = require('@openzeppelin/gsn-helpers');

const { expect } = require('chai');

const GSNRecipientMock = artifacts.require('GSNRecipientMock');

contract('GSNRecipient', function ([_, payee]) {
  beforeEach(async function () {
    this.recipient = await GSNRecipientMock.new();
  });

  it('returns the RelayHub address address', async function () {
    expect(await this.recipient.getHubAddr()).to.equal('0xD216153c06E857cD7f72665E0aF1d7D82172F494');
  });

  it('returns the compatible RelayHub version', async function () {
    expect(await this.recipient.relayHubVersion()).to.equal('1.0.0');
  });

  context('with deposited funds', async function () {
    const amount = ether('1');

    beforeEach(async function () {
      await gsn.fundRecipient(web3, { recipient: this.recipient.address, amount });
    });

    it('funds can be withdrawn', async function () {
      const balanceTracker = await balance.tracker(payee);
      const { logs } = await this.recipient.withdrawDeposits(amount, payee);
      expect(await balanceTracker.delta()).to.be.bignumber.equal(amount);

      expectEvent.inLogs(logs, 'GSNDepositsWithdrawn', { amount, payee });
    });

    it('partial funds can be withdrawn', async function () {
      const balanceTracker = await balance.tracker(payee);
      const { logs } = await this.recipient.withdrawDeposits(amount.divn(2), payee);
      expect(await balanceTracker.delta()).to.be.bignumber.equal(amount.divn(2));

      expectEvent.inLogs(logs, 'GSNDepositsWithdrawn', { amount: amount.divn(2), payee });
    });

    it('reverts on overwithdrawals', async function () {
      await expectRevert(this.recipient.withdrawDeposits(amount.addn(1), payee), 'insufficient funds');
    });
  });
});
