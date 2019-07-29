const { ether, expectEvent, expectRevert, singletons } = require('openzeppelin-test-helpers');
const { fixSignature } = require('../../helpers/sign');

const GSNRecipientSignedDataMock = artifacts.require('GSNRecipientSignedDataMock');

contract('GSNRecipientSignedData', function ([_, deployer, signer, other]) {
  beforeEach(async function () {
    this.relayHub = await singletons.RelayHub(deployer);

    this.recipient = await GSNRecipientSignedDataMock.new(signer, this.relayHub.address);
  });

  context('when called directly', function () {
    it('mock function can be called', async function () {
      const { logs } = await this.recipient.mockFunction();
      expectEvent.inLogs(logs, 'MockFunctionCalled');
    });
  });

  context('when relay-called', function () {
    beforeEach(async function () {
      await this.relayHub.depositFor(this.recipient.address, { from: deployer, value: ether('1') });
    });

    it('rejects unsigned relay requests', async function () {
      await expectRevert.unspecified(this.recipient.mockFunction({ value: 0, useGSN: true }));
    });

    it('rejects relay requests where some parameters are signed', async function () {
      await expectRevert.unspecified(this.recipient.mockFunction({
        value: 0,
        useGSN: true,
        approveFunction: async (data) =>
          // the nonce is not signed
          fixSignature(
            await web3.eth.sign(
              web3.utils.soliditySha3(
                data.relay_address, data.from, data.encodedFunctionCall, data.txfee, data.gas_price, data.gas_limit
              ), signer
            )
          )
      }));
    });

    it('accepts relay requests where all parameters are signed', async function () {
      const { tx } = await this.recipient.mockFunction({
        value: 0,
        useGSN: true,
        approveFunction: async (data) =>
          fixSignature(
            await web3.eth.sign(
              web3.utils.soliditySha3(
                data.relay_address, data.from, data.encodedFunctionCall, data.txfee, data.gas_price, data.gas_limit, data.nonce, data.relay_hub_address, this.recipient.address
              ), signer
            )
          )
      });

      await expectEvent.inTransaction(tx, GSNRecipientSignedDataMock, 'MockFunctionCalled');
    });
  });
});
