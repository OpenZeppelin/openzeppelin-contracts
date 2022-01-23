const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const { constants, expectEvent } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const gsn = require('@openzeppelin/gsn-helpers');
const { fixSignature } = require('../helpers/sign');
const { utils: { toBN } } = require('web3');

const ERC721GSNRecipientMock = contract.fromArtifact('ERC721GSNRecipientMock');

describe('ERC721GSNRecipient (integration)', function () {
  const [ signer, sender ] = accounts;

  const tokenId = '42';

  beforeEach(async function () {
    this.token = await ERC721GSNRecipientMock.new(signer);
  });

  async function testMintToken (token, from, tokenId, options = {}) {
    const { tx } = await token.mint(tokenId, { from, ...options });
    await expectEvent.inTransaction(tx, ERC721GSNRecipientMock, 'Transfer', { from: ZERO_ADDRESS, to: from, tokenId });
  }

  context('when called directly', function () {
    it('sender can mint tokens', async function () {
      await testMintToken(this.token, sender, tokenId);
    });
  });

  context('when relay-called', function () {
    beforeEach(async function () {
      await gsn.fundRecipient(web3, { recipient: this.token.address });
    });

    it('sender can mint tokens', async function () {
      const approveFunction = async (data) =>
        fixSignature(
          await web3.eth.sign(
            web3.utils.soliditySha3(
              // eslint-disable-next-line max-len
              data.relayerAddress, data.from, data.encodedFunctionCall, toBN(data.txFee), toBN(data.gasPrice), toBN(data.gas), toBN(data.nonce), data.relayHubAddress, this.token.address
            ), signer
          )
        );

      await testMintToken(this.token, sender, tokenId, { useGSN: true, approveFunction });
    });
  });
});
