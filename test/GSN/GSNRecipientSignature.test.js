const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const { expectEvent, expectRevert, constants } = require('@openzeppelin/test-helpers');
const gsn = require('@openzeppelin/gsn-helpers');
const { fixSignature } = require('../helpers/sign');
const { utils: { toBN } } = require('web3');
const { ZERO_ADDRESS } = constants;

const GSNRecipientSignatureMock = contract.fromArtifact('GSNRecipientSignatureMock');

describe('GSNRecipientSignature', function () {
  const [ signer, other ] = accounts;

  beforeEach(async function () {
    this.recipient = await GSNRecipientSignatureMock.new(signer);
  });

  context('when called directly', function () {
    it('mock function can be called', async function () {
      const { logs } = await this.recipient.mockFunction();
      expectEvent.inLogs(logs, 'MockFunctionCalled');
    });
  });

  context('when constructor is called with a zero address', function () {
    it('fails when constructor called with a zero address', async function () {
      await expectRevert(
        GSNRecipientSignatureMock.new(
          ZERO_ADDRESS
        ),
        'GSNRecipientSignature: trusted signer is the zero address'
      );
    });
  });

  context('when relay-called', function () {
    beforeEach(async function () {
      await gsn.fundRecipient(web3, { recipient: this.recipient.address });
    });

    it('rejects unsigned relay requests', async function () {
      await gsn.expectError(this.recipient.mockFunction({ value: 0, useGSN: true }));
    });

    it('rejects relay requests where some parameters are signed', async function () {
      const approveFunction = async (data) =>
        fixSignature(
          await web3.eth.sign(
            web3.utils.soliditySha3(
              // the nonce is not signed
              // eslint-disable-next-line max-len
              data.relayerAddress, data.from, data.encodedFunctionCall, toBN(data.txFee), toBN(data.gasPrice), toBN(data.gas)
            ), signer
          )
        );

      await gsn.expectError(this.recipient.mockFunction({ value: 0, useGSN: true, approveFunction }));
    });

    it('accepts relay requests where all parameters are signed', async function () {
      const approveFunction = async (data) =>
        fixSignature(
          await web3.eth.sign(
            web3.utils.soliditySha3(
              // eslint-disable-next-line max-len
              data.relayerAddress, data.from, data.encodedFunctionCall, toBN(data.txFee), toBN(data.gasPrice), toBN(data.gas), toBN(data.nonce), data.relayHubAddress, data.to
            ), signer
          )
        );

      const { tx } = await this.recipient.mockFunction({ value: 0, useGSN: true, approveFunction });

      await expectEvent.inTransaction(tx, GSNRecipientSignatureMock, 'MockFunctionCalled');
    });

    it('rejects relay requests where all parameters are signed by an invalid signer', async function () {
      const approveFunction = async (data) =>
        fixSignature(
          await web3.eth.sign(
            web3.utils.soliditySha3(
              // eslint-disable-next-line max-len
              data.relayerAddress, data.from, data.encodedFunctionCall, toBN(data.txFee), toBN(data.gasPrice), toBN(data.gas), toBN(data.nonce), data.relayHubAddress, data.to
            ), other
          )
        );

      await gsn.expectError(this.recipient.mockFunction({ value: 0, useGSN: true, approveFunction }));
    });
  });
});
