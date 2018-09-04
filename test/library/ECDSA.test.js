const { signMessage, toEthSignedMessageHash } = require('../helpers/sign');
const { expectThrow } = require('../helpers/expectThrow');

const ECDSAMock = artifacts.require('ECDSAMock');

require('chai')
  .should();

const TEST_MESSAGE = web3.sha3('OpenZeppelin');
const WRONG_MESSAGE = web3.sha3('Nope');

contract('ECDSA', function ([_, anyone]) {
  beforeEach(async function () {
    this.mock = await ECDSAMock.new();
  });

  it('recover v0', async function () {
    // Signature generated outside ganache with method web3.eth.sign(signer, message)
    const signer = '0x2cc1166f6212628a0deef2b33befb2187d35b86c';
    // eslint-disable-next-line max-len
    const signature = '0x5d99b6f7f6d1f73d1a26497f2b1c89b24c0993913f86e9a2d02cd69887d9c94f3c880358579d811b21dd1b7fd9bb01c1d81d10e69f0384e675c32b39643be89200';
    (await this.mock.recover(TEST_MESSAGE, signature)).should.equal(signer);
  });

  it('recover v1', async function () {
    // Signature generated outside ganache with method web3.eth.sign(signer, message)
    const signer = '0x1e318623ab09fe6de3c9b8672098464aeda9100e';
    // eslint-disable-next-line max-len
    const signature = '0x331fe75a821c982f9127538858900d87d3ec1f9f737338ad67cad133fa48feff48e6fa0c18abc62e42820f05943e47af3e9fbe306ce74d64094bdf1691ee53e001';
    (await this.mock.recover(TEST_MESSAGE, signature)).should.equal(signer);
  });

  it('recover using web3.eth.sign()', async function () {
    // Create the signature
    const signature = signMessage(anyone, TEST_MESSAGE);

    // Recover the signer address from the generated message and signature.
    (await this.mock.recover(
      toEthSignedMessageHash(TEST_MESSAGE),
      signature
    )).should.equal(anyone);
  });

  it('recover using web3.eth.sign() should return wrong signer', async function () {
    // Create the signature
    const signature = signMessage(anyone, TEST_MESSAGE);

    // Recover the signer address from the generated message and wrong signature.
    (await this.mock.recover(WRONG_MESSAGE, signature)).should.not.equal(anyone);
  });

  // @TODO - remove `skip` once we upgrade to solc^0.5
  it.skip('recover should revert when a small hash is sent', async function () {
    // Create the signature
    const signature = signMessage(anyone, TEST_MESSAGE);
    await expectThrow(
      this.mock.recover(TEST_MESSAGE.substring(2), signature)
    );
  });

  context('toEthSignedMessage', function () {
    it('should prefix hashes correctly', async function () {
      (await this.mock.toEthSignedMessageHash(TEST_MESSAGE)).should.equal(toEthSignedMessageHash(TEST_MESSAGE));
    });
  });
});
