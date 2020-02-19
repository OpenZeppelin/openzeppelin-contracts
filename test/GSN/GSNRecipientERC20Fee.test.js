const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const { ether, expectEvent } = require('@openzeppelin/test-helpers');
const gsn = require('@openzeppelin/gsn-helpers');

const { expect } = require('chai');

const GSNRecipientERC20FeeMock = contract.fromArtifact('GSNRecipientERC20FeeMock');
const ERC20Detailed = contract.fromArtifact('ERC20Detailed');
const IRelayHub = contract.fromArtifact('IRelayHub');

describe('GSNRecipientERC20Fee', function () {
  const [ sender ] = accounts;

  const name = 'FeeToken';
  const symbol = 'FTKN';

  beforeEach(async function () {
    this.recipient = await GSNRecipientERC20FeeMock.new(name, symbol);
    this.token = await ERC20Detailed.at(await this.recipient.token());
  });

  describe('token', function () {
    it('has a name', async function () {
      expect(await this.token.name()).to.equal(name);
    });

    it('has a symbol', async function () {
      expect(await this.token.symbol()).to.equal(symbol);
    });

    it('has 18 decimals', async function () {
      expect(await this.token.decimals()).to.be.bignumber.equal('18');
    });
  });

  context('when called directly', function () {
    it('mock function can be called', async function () {
      const { logs } = await this.recipient.mockFunction();
      expectEvent.inLogs(logs, 'MockFunctionCalled');
    });
  });

  context('when relay-called', function () {
    beforeEach(async function () {
      await gsn.fundRecipient(web3, { recipient: this.recipient.address });
      this.relayHub = await IRelayHub.at('0xD216153c06E857cD7f72665E0aF1d7D82172F494');
    });

    it('charges the sender for GSN fees in tokens', async function () {
      // The recipient will be charged from its RelayHub balance, and in turn charge the sender from its sender balance.
      // Both amounts should be roughly equal.

      // The sender has a balance in tokens, not ether, but since the exchange rate is 1:1, this works fine.
      const senderPreBalance = ether('2');
      await this.recipient.mint(sender, senderPreBalance);

      const recipientPreBalance = await this.relayHub.balanceOf(this.recipient.address);

      const { tx } = await this.recipient.mockFunction({ from: sender, useGSN: true });
      await expectEvent.inTransaction(tx, IRelayHub, 'TransactionRelayed', { status: '0' });

      const senderPostBalance = await this.token.balanceOf(sender);
      const recipientPostBalance = await this.relayHub.balanceOf(this.recipient.address);

      const senderCharge = senderPreBalance.sub(senderPostBalance);
      const recipientCharge = recipientPreBalance.sub(recipientPostBalance);

      expect(senderCharge).to.be.bignumber.closeTo(recipientCharge, recipientCharge.divn(10));
    });
  });
});
