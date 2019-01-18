const { signMessage, toEthSignedMessageHash } = require('../helpers/sign');
const shouldFail = require('../helpers/shouldFail');

const ECDSAMock = artifacts.require('ECDSAMock');

require('../helpers/setup');

const TEST_MESSAGE = web3.sha3('OpenZeppelin');
const WRONG_MESSAGE = web3.sha3('Nope');

contract('ECDSA', function ([_, anyone]) {
  beforeEach(async function () {
    this.ecdsa = await ECDSAMock.new();
  });

  context('recover with valid signature', function () {
    context('with v0 signature', function () {
      // Signature generated outside ganache with method web3.eth.sign(signer, message)
      const signer = '0x2cc1166f6212628a0deef2b33befb2187d35b86c';
      // eslint-disable-next-line max-len
      const signatureWithoutVersion = '0x5d99b6f7f6d1f73d1a26497f2b1c89b24c0993913f86e9a2d02cd69887d9c94f3c880358579d811b21dd1b7fd9bb01c1d81d10e69f0384e675c32b39643be892';

      context('with 00 as version value', function () {
        it('works', async function () {
          const version = '00';
          const signature = signatureWithoutVersion + version;
          (await this.ecdsa.recover(TEST_MESSAGE, signature)).should.equal(signer);
        });
      });

      context('with 27 as version value', function () {
        it('works', async function () {
          const version = '1b'; // 27 = 1b.
          const signature = signatureWithoutVersion + version;
          (await this.ecdsa.recover(TEST_MESSAGE, signature)).should.equal(signer);
        });
      });

      context('with wrong version', function () {
        it('returns 0', async function () {
          // The last two hex digits are the signature version.
          // The only valid values are 0, 1, 27 and 28.
          const version = '02';
          const signature = signatureWithoutVersion + version;
          (await this.ecdsa.recover(TEST_MESSAGE, signature)).should.equal(
            '0x0000000000000000000000000000000000000000');
        });
      });
    });

    context('with v1 signature', function () {
      const signer = '0x1e318623ab09fe6de3c9b8672098464aeda9100e';
      // eslint-disable-next-line max-len
      const signatureWithoutVersion = '0x331fe75a821c982f9127538858900d87d3ec1f9f737338ad67cad133fa48feff48e6fa0c18abc62e42820f05943e47af3e9fbe306ce74d64094bdf1691ee53e0';

      context('with 01 as version value', function () {
        it('works', async function () {
          const version = '01';
          const signature = signatureWithoutVersion + version;
          (await this.ecdsa.recover(TEST_MESSAGE, signature)).should.equal(signer);
        });
      });

      context('with 28 signature', function () {
        it('works', async function () {
          const version = '1c'; // 28 = 1c.
          const signature = signatureWithoutVersion + version;
          (await this.ecdsa.recover(TEST_MESSAGE, signature)).should.equal(signer);
        });
      });

      context('with wrong version', function () {
        it('returns 0', async function () {
          // The last two hex digits are the signature version.
          // The only valid values are 0, 1, 27 and 28.
          const version = '02';
          const signature = signatureWithoutVersion + version;
          (await this.ecdsa.recover(TEST_MESSAGE, signature)).should.equal(
            '0x0000000000000000000000000000000000000000');
        });
      });
    });

    context('using web3.eth.sign', function () {
      context('with correct signature', function () {
        it('returns signer address', async function () {
          // Create the signature
          const signature = signMessage(anyone, TEST_MESSAGE);

          // Recover the signer address from the generated message and signature.
          (await this.ecdsa.recover(
            toEthSignedMessageHash(TEST_MESSAGE),
            signature
          )).should.equal(anyone);
        });
      });

      context('with wrong signature', function () {
        it('does not return signer address', async function () {
          // Create the signature
          const signature = signMessage(anyone, TEST_MESSAGE);

          // Recover the signer address from the generated message and wrong signature.
          (await this.ecdsa.recover(WRONG_MESSAGE, signature)).should.not.equal(anyone);
        });
      });
    });
  });

  context('with small hash', function () {
    // @TODO - remove `skip` once we upgrade to solc^0.5
    it.skip('reverts', async function () {
      // Create the signature
      const signature = signMessage(anyone, TEST_MESSAGE);
      await shouldFail.reverting(
        this.ecdsa.recover(TEST_MESSAGE.substring(2), signature)
      );
    });
  });

  context('toEthSignedMessage', function () {
    it('should prefix hashes correctly', async function () {
      (await this.ecdsa.toEthSignedMessageHash(TEST_MESSAGE)).should.equal(toEthSignedMessageHash(TEST_MESSAGE));
    });
  });
});
