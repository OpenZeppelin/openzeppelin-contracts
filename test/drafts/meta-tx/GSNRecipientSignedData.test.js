const { expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const gsn = require('@openzeppelin/gsn-helpers');
const { fixSignature } = require('../../helpers/sign');

const GSNRecipientSignedDataMock = artifacts.require('GSNRecipientSignedDataMock');

contract('GSNRecipientSignedData', function ([_, deployer, signer, other]) {
  beforeEach(async function () {
    this.recipient = await GSNRecipientSignedDataMock.new(signer);
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
    });

    it('rejects unsigned relay requests', async function () {
      await expectRevert.unspecified(this.recipient.mockFunction({ value: 0, useGSN: true }));
    });

    it('rejects relay requests where some parameters are signed', async function () {
      const approveFunction = async (data) =>
        fixSignature(
          await web3.eth.sign(
            web3.utils.soliditySha3(
              // the nonce is not signed
              data.relay_address, data.from, data.encodedFunctionCall, data.txfee, data.gas_price, data.gas_limit
            ), signer
          )
        );

      await expectRevert.unspecified(this.recipient.mockFunction({ value: 0, useGSN: true, approveFunction }));
    });

    it('accepts relay requests where all parameters are signed', async function () {
      const approveFunction = async (data) =>
        fixSignature(
          await web3.eth.sign(
            web3.utils.soliditySha3(
              // eslint-disable-next-line max-len
              data.relay_address, data.from, data.encodedFunctionCall, data.txfee, data.gas_price, data.gas_limit, data.nonce, data.relay_hub_address, this.recipient.address
            ), signer
          )
        );

      const { tx } = await this.recipient.mockFunction({ value: 0, useGSN: true, approveFunction });

      await expectEvent.inTransaction(tx, GSNRecipientSignedDataMock, 'MockFunctionCalled');
    });
  });
});
