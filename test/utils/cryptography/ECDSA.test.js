const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const TEST_MESSAGE = ethers.id('OpenZeppelin');
const WRONG_MESSAGE = ethers.id('Nope');
const NON_HASH_MESSAGE = '0xabcd';

function toSignature(signature) {
  return ethers.Signature.from(signature);
}

async function fixture() {
  const [signer] = await ethers.getSigners();
  const mock = await ethers.deployContract('$ECDSA');
  return { signer, mock };
}

describe('ECDSA', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('recover with invalid signature', function () {
    it('with short signature', async function () {
      await expect(this.mock.$recover(TEST_MESSAGE, '0x1234'))
        .to.be.revertedWithCustomError(this.mock, 'ECDSAInvalidSignatureLength')
        .withArgs(2);
    });

    it('with long signature', async function () {
      await expect(
        // eslint-disable-next-line max-len
        this.mock.$recover(
          TEST_MESSAGE,
          '0x01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789',
        ),
      )
        .to.be.revertedWithCustomError(this.mock, 'ECDSAInvalidSignatureLength')
        .withArgs(85);
    });
  });

  describe('recover with valid signature', function () {
    describe('using <signer>.sign', function () {
      it('returns signer address with correct signature', async function () {
        // Create the signature
        const signature = await this.signer.signMessage(TEST_MESSAGE);

        // Recover the signer address from the generated message and signature.
        expect(await this.mock.$recover(ethers.hashMessage(TEST_MESSAGE), signature)).to.equal(this.signer.address);
      });

      it('returns signer address with correct signature for arbitrary length message', async function () {
        // Create the signature
        const signature = await this.signer.signMessage(NON_HASH_MESSAGE);

        // Recover the signer address from the generated message and signature.
        expect(await this.mock.$recover(ethers.hashMessage(NON_HASH_MESSAGE), signature)).to.equal(this.signer.address);
      });

      it('returns a different address', async function () {
        const signature = await this.signer.signMessage(TEST_MESSAGE);
        expect(await this.mock.$recover(WRONG_MESSAGE, signature)).to.not.be.equal(this.signer.address);
      });

      it('reverts with invalid signature', async function () {
        // eslint-disable-next-line max-len
        const signature =
          '0x332ce75a821c982f9127538858900d87d3ec1f9f737338ad67cad133fa48feff48e6fa0c18abc62e42820f05943e47af3e9fbe306ce74d64094bdf1691ee53e01c';
        await expect(this.mock.$recover(TEST_MESSAGE, signature)).to.be.revertedWithCustomError(
          this.mock,
          'ECDSAInvalidSignature',
        );
      });
    });

    describe('with v=27 signature', function () {
      // Signature generated outside ganache with method web3.eth.sign(signer, message)
      const signer = '0x2cc1166f6212628A0deEf2B33BEFB2187D35b86c';
      // eslint-disable-next-line max-len
      const signatureWithoutV =
        '0x5d99b6f7f6d1f73d1a26497f2b1c89b24c0993913f86e9a2d02cd69887d9c94f3c880358579d811b21dd1b7fd9bb01c1d81d10e69f0384e675c32b39643be892';

      it('works with correct v value', async function () {
        const v = '0x1b'; // 27 = 1b.
        const signature = ethers.concat([signatureWithoutV, v]);
        expect(await this.mock.$recover(TEST_MESSAGE, signature)).to.equal(signer);

        const { r, s, yParityAndS: vs } = toSignature(signature);
        expect(await this.mock.getFunction('$recover(bytes32,uint8,bytes32,bytes32)')(TEST_MESSAGE, v, r, s)).to.equal(
          signer,
        );

        expect(await this.mock.getFunction('$recover(bytes32,bytes32,bytes32)')(TEST_MESSAGE, r, vs)).to.equal(signer);
      });

      it('rejects incorrect v value', async function () {
        const v = '0x1c'; // 28 = 1c.
        const signature = ethers.concat([signatureWithoutV, v]);
        expect(await this.mock.$recover(TEST_MESSAGE, signature)).to.not.equal(signer);

        const { r, s, yParityAndS: vs } = toSignature(signature);
        expect(
          await this.mock.getFunction('$recover(bytes32,uint8,bytes32,bytes32)')(TEST_MESSAGE, v, r, s),
        ).to.not.equal(signer);

        expect(await this.mock.getFunction('$recover(bytes32,bytes32,bytes32)')(TEST_MESSAGE, r, vs)).to.not.equal(
          signer,
        );
      });

      it('reverts wrong v values', async function () {
        for (const v of ['0x00', '0x01']) {
          const signature = ethers.concat([signatureWithoutV, v]);
          await expect(this.mock.$recover(TEST_MESSAGE, signature)).to.be.revertedWithCustomError(
            this.mock,
            'ECDSAInvalidSignature',
          );

          const { r, s } = toSignature(signature);
          await expect(
            this.mock.getFunction('$recover(bytes32,uint8,bytes32,bytes32)')(TEST_MESSAGE, v, r, s),
          ).to.be.revertedWithCustomError(this.mock, 'ECDSAInvalidSignature');
        }
      });

      it('rejects short EIP2098 format', async function () {
        const v = '0x1b'; // 27 = 1b.
        const signature = ethers.concat([signatureWithoutV, v]);
        await expect(this.mock.$recover(TEST_MESSAGE, toSignature(signature).compactSerialized))
          .to.be.revertedWithCustomError(this.mock, 'ECDSAInvalidSignatureLength')
          .withArgs(64);
      });
    });

    describe('with v=28 signature', function () {
      const signer = '0x1E318623aB09Fe6de3C9b8672098464Aeda9100E';
      // eslint-disable-next-line max-len
      const signatureWithoutV =
        '0x331fe75a821c982f9127538858900d87d3ec1f9f737338ad67cad133fa48feff48e6fa0c18abc62e42820f05943e47af3e9fbe306ce74d64094bdf1691ee53e0';

      it('works with correct v value', async function () {
        const v = '0x1c'; // 28 = 1c.
        const signature = ethers.concat([signatureWithoutV, v]);
        expect(await this.mock.$recover(TEST_MESSAGE, signature)).to.equal(signer);

        const { r, s, yParityAndS: vs } = toSignature(signature);
        expect(await this.mock.getFunction('$recover(bytes32,uint8,bytes32,bytes32)')(TEST_MESSAGE, v, r, s)).to.equal(
          signer,
        );

        expect(await this.mock.getFunction('$recover(bytes32,bytes32,bytes32)')(TEST_MESSAGE, r, vs)).to.equal(signer);
      });

      it('rejects incorrect v value', async function () {
        const v = '0x1b'; // 27 = 1b.
        const signature = ethers.concat([signatureWithoutV, v]);
        expect(await this.mock.$recover(TEST_MESSAGE, signature)).to.not.equal(signer);

        const { r, s, yParityAndS: vs } = toSignature(signature);
        expect(
          await this.mock.getFunction('$recover(bytes32,uint8,bytes32,bytes32)')(TEST_MESSAGE, v, r, s),
        ).to.not.equal(signer);

        expect(await this.mock.getFunction('$recover(bytes32,bytes32,bytes32)')(TEST_MESSAGE, r, vs)).to.not.equal(
          signer,
        );
      });

      it('reverts invalid v values', async function () {
        for (const v of ['0x00', '0x01']) {
          const signature = ethers.concat([signatureWithoutV, v]);
          await expect(this.mock.$recover(TEST_MESSAGE, signature)).to.be.revertedWithCustomError(
            this.mock,
            'ECDSAInvalidSignature',
          );

          const { r, s } = toSignature(signature);
          await expect(
            this.mock.getFunction('$recover(bytes32,uint8,bytes32,bytes32)')(TEST_MESSAGE, v, r, s),
          ).to.be.revertedWithCustomError(this.mock, 'ECDSAInvalidSignature');
        }
      });

      it('rejects short EIP2098 format', async function () {
        const v = '0x1c'; // 27 = 1b.
        const signature = ethers.concat([signatureWithoutV, v]);
        await expect(this.mock.$recover(TEST_MESSAGE, toSignature(signature).compactSerialized))
          .to.be.revertedWithCustomError(this.mock, 'ECDSAInvalidSignatureLength')
          .withArgs(64);
      });
    });

    it('reverts with high-s value signature', async function () {
      const message = '0xb94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';
      // eslint-disable-next-line max-len
      const highSSignature =
        '0xe742ff452d41413616a5bf43fe15dd88294e983d3d36206c2712f39083d638bde0a0fc89be718fbc1033e1d30d78be1c68081562ed2e97af876f286f3453231d1b';

      const r = ethers.dataSlice(highSSignature, 0, 32);
      const s = ethers.dataSlice(highSSignature, 32, 64);
      const v = ethers.dataSlice(highSSignature, 64, 65);

      await expect(this.mock.$recover(message, highSSignature))
        .to.be.revertedWithCustomError(this.mock, 'ECDSAInvalidSignatureS')
        .withArgs(s);
      await expect(this.mock.getFunction('$recover(bytes32,uint8,bytes32,bytes32)')(TEST_MESSAGE, v, r, s))
        .to.be.revertedWithCustomError(this.mock, 'ECDSAInvalidSignatureS')
        .withArgs(s);
      expect(() => toSignature(highSSignature)).to.throw('non-canonical s');
    });
  });
});
