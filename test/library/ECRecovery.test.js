
import {
  hashMessage,
  signMessage,
} from '../helpers/sign';
const ECRecoveryMock = artifacts.require('ECRecoveryMock');

require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('ECRecovery', function (accounts) {
  let ecrecovery;
  const TEST_MESSAGE = 'OpenZeppelin';

  before(async function () {
    ecrecovery = await ECRecoveryMock.new();
  });

  it('recover v0', async function () {
    // Signature generated outside ganache with method web3.eth.sign(signer, message)
    let signer = '0x2cc1166f6212628a0deef2b33befb2187d35b86c';
    let message = web3.sha3(TEST_MESSAGE);
    // eslint-disable-next-line max-len
    let signature = '0x5d99b6f7f6d1f73d1a26497f2b1c89b24c0993913f86e9a2d02cd69887d9c94f3c880358579d811b21dd1b7fd9bb01c1d81d10e69f0384e675c32b39643be89200';
    const addrRecovered = await ecrecovery.recover(message, signature);
    addrRecovered.should.eq(signer);
  });

  it('recover v1', async function () {
    // Signature generated outside ganache with method web3.eth.sign(signer, message)
    let signer = '0x1e318623ab09fe6de3c9b8672098464aeda9100e';
    let message = web3.sha3(TEST_MESSAGE);
    // eslint-disable-next-line max-len
    let signature = '0x331fe75a821c982f9127538858900d87d3ec1f9f737338ad67cad133fa48feff48e6fa0c18abc62e42820f05943e47af3e9fbe306ce74d64094bdf1691ee53e001';
    const addrRecovered = await ecrecovery.recover(message, signature);
    addrRecovered.should.eq(signer);
  });

  it('recover using web3.eth.sign()', async function () {
    // Create the signature using account[0]
    const signature = signMessage(accounts[0], TEST_MESSAGE);

    // Recover the signer address from the generated message and signature.
    const addrRecovered = await ecrecovery.recover(
      hashMessage(TEST_MESSAGE),
      signature
    );
    addrRecovered.should.eq(accounts[0]);
  });

  it('recover using web3.eth.sign() should return wrong signer', async function () {
    // Create the signature using account[0]
    const signature = signMessage(accounts[0], TEST_MESSAGE);

    // Recover the signer address from the generated message and wrong signature.
    const addrRecovered = await ecrecovery.recover(hashMessage('Test'), signature);
    assert.notEqual(accounts[0], addrRecovered);
  });

  it('recover should fail when a wrong hash is sent', async function () {
    // Create the signature using account[0]
    let signature = signMessage(accounts[0], TEST_MESSAGE);

    // Recover the signer address from the generated message and wrong signature.
    const addrRecovered = await ecrecovery.recover(hashMessage(TEST_MESSAGE).substring(2), signature);
    addrRecovered.should.eq('0x0000000000000000000000000000000000000000');
  });

  context('toEthSignedMessage', () => {
    it('should prefix hashes correctly', async function () {
      const hashedMessage = web3.sha3(TEST_MESSAGE);
      const ethMessage = await ecrecovery.toEthSignedMessageHash(hashedMessage);
      ethMessage.should.eq(hashMessage(TEST_MESSAGE));
    });
  });
});
