const { constants, expectEvent } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const gsn = require('@openzeppelin/gsn-helpers');
const { fixSignature } = require('../helpers/sign');
const { setGSNProvider } = require('../helpers/set-gsn-provider');
const { utils: { toBN } } = require('web3');

const ERC721GSNRecipientMock = artifacts.require('ERC721GSNRecipientMock');

contract('ERC721GSNRecipient (integration)', function (accounts) {
  const [ signer, sender ] = accounts;

  const name = 'Non Fungible Token';
  const symbol = 'NFT';
  const tokenId = '42';

  before(function () {
    setGSNProvider(ERC721GSNRecipientMock, accounts);
  });

  beforeEach(async function () {
    this.token = await ERC721GSNRecipientMock.new(name, symbol, signer);
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
              data.relayerAddress, data.from, data.encodedFunctionCall, toBN(data.txFee), toBN(data.gasPrice), toBN(data.gas), toBN(data.nonce), data.relayHubAddress, this.token.address,
            ), signer,
          ),
        );

      await testMintToken(this.token, sender, tokenId, { useGSN: true, approveFunction });
    });
  });
});
