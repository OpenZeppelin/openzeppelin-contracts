const { expectRevert } = require('@openzeppelin/test-helpers');
const { toEthSignedMessageHash, fixSignature } = require('../helpers/sign');

const { expect } = require('chai');

const ECDSAMock = artifacts.require('ECDSAMock');

const TEST_MESSAGE = web3.utils.sha3('OpenZeppelin');
const WRONG_MESSAGE = web3.utils.sha3('Nope');

contract('ECDSA', function (accounts) {
  const [ other ] = accounts;

  beforeEach(async function () {
    this.ecdsa = await ECDSAMock.new();
  });

  context('recover with invalid signature', function () {
    it('with short signature', async function () {
      await expectRevert(this.ecdsa.recover(TEST_MESSAGE, '0x1234'), 'ECDSA: invalid signature length');
    });

    it('with long signature', async function () {
      await expectRevert(
        // eslint-disable-next-line max-len
        this.ecdsa.recover(TEST_MESSAGE, '0x01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789'),
        'ECDSA: invalid signature length',
      );
    });
  });

  context('recover with valid signature', function () {
    context('with v0 signature', function () {
      // Signature generated outside ganache with method web3.eth.sign(signer, message)
      const signer = '0x2cc1166f6212628A0deEf2B33BEFB2187D35b86c';
      // eslint-disable-next-line max-len
      const signatureWithoutVersion = '0x5d99b6f7f6d1f73d1a26497f2b1c89b24c0993913f86e9a2d02cd69887d9c94f3c880358579d811b21dd1b7fd9bb01c1d81d10e69f0384e675c32b39643be892';

      context('with 00 as version value', function () {
        it('reverts', async function () {
          const version = '00';
          const signature = signatureWithoutVersion + version;
          await expectRevert(this.ecdsa.recover(TEST_MESSAGE, signature), 'ECDSA: invalid signature \'v\' value');
        });
      });

      context('with 27 as version value', function () {
        it('works', async function () {
          const version = '1b'; // 27 = 1b.
          const signature = signatureWithoutVersion + version;
          expect(await this.ecdsa.recover(TEST_MESSAGE, signature)).to.equal(signer);
        });
      });

      context('with wrong version', function () {
        it('reverts', async function () {
          // The last two hex digits are the signature version.
          // The only valid values are 0, 1, 27 and 28.
          const version = '02';
          const signature = signatureWithoutVersion + version;
          await expectRevert(this.ecdsa.recover(TEST_MESSAGE, signature), 'ECDSA: invalid signature \'v\' value');
        });
      });
    });

    context('with v1 signature', function () {
      const signer = '0x1E318623aB09Fe6de3C9b8672098464Aeda9100E';
      // eslint-disable-next-line max-len
      const signatureWithoutVersion = '0x331fe75a821c982f9127538858900d87d3ec1f9f737338ad67cad133fa48feff48e6fa0c18abc62e42820f05943e47af3e9fbe306ce74d64094bdf1691ee53e0';

      context('with 01 as version value', function () {
        it('reverts', async function () {
          const version = '01';
          const signature = signatureWithoutVersion + version;
          await expectRevert(this.ecdsa.recover(TEST_MESSAGE, signature), 'ECDSA: invalid signature \'v\' value');
        });
      });

      context('with 28 as version value', function () {
        it('works', async function () {
          const version = '1c'; // 28 = 1c.
          const signature = signatureWithoutVersion + version;
          expect(await this.ecdsa.recover(TEST_MESSAGE, signature)).to.equal(signer);
        });
      });

      context('with wrong version', function () {
        it('reverts', async function () {
          // The last two hex digits are the signature version.
          // The only valid values are 0, 1, 27 and 28.
          const version = '02';
          const signature = signatureWithoutVersion + version;
          await expectRevert(this.ecdsa.recover(TEST_MESSAGE, signature), 'ECDSA: invalid signature \'v\' value');
        });
      });
    });

    context('with high-s value signature', function () {
      it('reverts', async function () {
        const message = '0xb94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';
        // eslint-disable-next-line max-len
        const highSSignature = '0xe742ff452d41413616a5bf43fe15dd88294e983d3d36206c2712f39083d638bde0a0fc89be718fbc1033e1d30d78be1c68081562ed2e97af876f286f3453231d1b';

        await expectRevert(this.ecdsa.recover(message, highSSignature), 'ECDSA: invalid signature \'s\' value');
      });
    });

    context('using web3.eth.sign', function () {
      context('with correct signature', function () {
        it('returns signer address', async function () {
          // Create the signature
          const signature = fixSignature(await web3.eth.sign(TEST_MESSAGE, other));

          // Recover the signer address from the generated message and signature.
          expect(await this.ecdsa.recover(
            toEthSignedMessageHash(TEST_MESSAGE),
            signature,
          )).to.equal(other);
        });
      });

      context('with wrong message', function () {
        it('returns a different address', async function () {
          const signature = fixSignature(await web3.eth.sign(TEST_MESSAGE, other));
          expect(await this.ecdsa.recover(WRONG_MESSAGE, signature)).to.not.equal(other);
        });
      });

      context('with invalid signature', function () {
        it('reverts', async function () {
          // eslint-disable-next-line max-len
          const signature = '0x332ce75a821c982f9127538858900d87d3ec1f9f737338ad67cad133fa48feff48e6fa0c18abc62e42820f05943e47af3e9fbe306ce74d64094bdf1691ee53e01c';
          await expectRevert(this.ecdsa.recover(TEST_MESSAGE, signature), 'ECDSA: invalid signature');
        });
      });
    });
  });

  context('toEthSignedMessage', function () {
    it('should prefix hashes correctly', async function () {
      expect(await this.ecdsa.toEthSignedMessageHash(TEST_MESSAGE)).to.equal(toEthSignedMessageHash(TEST_MESSAGE));
    });
  });
});
