const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');

const VALID_SW_KEY_1 = ethers.toUtf8Bytes('valid_key_1');
const VALID_SW_KEY_2 = ethers.toUtf8Bytes('valid_key_2');

const VALID_SW_SIGNATURE_1 = ethers.toUtf8Bytes('valid_signature_1');
const VALID_SW_SIGNATURE_2 = ethers.toUtf8Bytes('valid_signature_2');

async function fixture() {
  const [, signer, other, extraSigner] = await ethers.getSigners();
  const mock = await ethers.deployContract('$ERC7913Utils');

  // Deploy a mock ERC-1271 wallet
  const wallet = await ethers.deployContract('ERC1271WalletMock', [signer]);
  const wallet2 = await ethers.deployContract('ERC1271WalletMock', [extraSigner]);

  // Deploy a mock ERC-7913 verifier
  const verifier = await ethers.deployContract('ERC7913VerifierMock');

  return {
    signer,
    extraSigner,
    other,
    mock,
    wallet,
    wallet2,
    verifier,
  };
}

describe('ERC7913Utils', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('isValidSignatureNow', function () {
    describe('with EOA signer', function () {
      it('with matching signer and signature', async function () {
        const eoaSigner = ethers.zeroPadValue(this.signer.address, 20);
        const message = 'Hello, World!';
        const signature = await this.signer.signMessage(message);
        await expect(this.mock.$isValidSignatureNow(eoaSigner, ethers.hashMessage(message), signature)).to.eventually.be
          .true;
      });

      it('with invalid signer', async function () {
        const eoaSigner = ethers.zeroPadValue(this.other.address, 20);
        const message = 'Hello, World!';
        const signature = await this.signer.signMessage(message);
        await expect(this.mock.$isValidSignatureNow(eoaSigner, ethers.hashMessage(message), signature)).to.eventually.be
          .false;
      });

      it('with invalid signature', async function () {
        const eoaSigner = ethers.zeroPadValue(this.signer.address, 20);
        const signature = await this.signer.signMessage('Hello, World!');
        await expect(this.mock.$isValidSignatureNow(eoaSigner, ethers.hashMessage('Nope'), signature)).to.eventually.be
          .false;
      });
    });

    describe('with ERC-1271 wallet', function () {
      it('with matching signer and signature', async function () {
        const walletSigner = ethers.zeroPadValue(this.wallet.target, 20);
        const message = 'Hello, World!';
        const signature = await this.signer.signMessage(message);
        await expect(this.mock.$isValidSignatureNow(walletSigner, ethers.hashMessage(message), signature)).to.eventually
          .be.true;
      });

      it('with invalid signer', async function () {
        const walletSigner = ethers.zeroPadValue(this.mock.target, 20);
        const message = 'Hello, World!';
        const signature = await this.signer.signMessage(message);
        await expect(this.mock.$isValidSignatureNow(walletSigner, ethers.hashMessage(message), signature)).to.eventually
          .be.false;
      });

      it('with invalid signature', async function () {
        const walletSigner = ethers.zeroPadValue(this.wallet.target, 20);
        const signature = await this.signer.signMessage('Hello, World!');
        await expect(this.mock.$isValidSignatureNow(walletSigner, ethers.hashMessage('Nope'), signature)).to.eventually
          .be.false;
      });
    });

    describe('with ERC-7913 verifier', function () {
      it('with matching signer and signature', async function () {
        await expect(
          this.mock.$isValidSignatureNow(
            ethers.concat([this.verifier.target, VALID_SW_KEY_1]),
            ethers.hashMessage('Hello, World!'),
            VALID_SW_SIGNATURE_1,
          ),
        ).to.eventually.be.true;
      });

      it('with invalid verifier', async function () {
        const invalidVerifierSigner = ethers.concat([this.mock.target, VALID_SW_KEY_1]);
        await expect(
          this.mock.$isValidSignatureNow(
            invalidVerifierSigner,
            ethers.hashMessage('Hello, World!'),
            VALID_SW_SIGNATURE_1,
          ),
        ).to.eventually.be.false;
      });

      it('with invalid key', async function () {
        await expect(
          this.mock.$isValidSignatureNow(
            ethers.concat([this.verifier.target, ethers.randomBytes(32)]),
            ethers.hashMessage('Hello, World!'),
            VALID_SW_SIGNATURE_1,
          ),
        ).to.eventually.be.false;
      });

      it('with invalid signature', async function () {
        await expect(
          this.mock.$isValidSignatureNow(
            ethers.concat([this.verifier.target, VALID_SW_KEY_1]),
            ethers.hashMessage('Hello, World!'),
            ethers.randomBytes(65),
          ),
        ).to.eventually.be.false;
      });

      it('with signer too short', async function () {
        const shortSigner = ethers.randomBytes(19);
        await expect(
          this.mock.$isValidSignatureNow(shortSigner, ethers.hashMessage('Hello, World!'), VALID_SW_SIGNATURE_1),
        ).to.eventually.be.false;
      });
    });
  });

  describe('areValidSignaturesNow', function () {
    it('should validate a single signature', async function () {
      const message = 'Hello, World!';
      const signature = await this.signer.signMessage(message);
      await expect(
        this.mock.$areValidSignaturesNow(
          ethers.hashMessage(message),
          [ethers.zeroPadValue(this.signer.address, 20)],
          [signature],
        ),
      ).to.eventually.be.true;
    });

    it('should validate multiple signatures with different signer types', async function () {
      const message = 'Hello, World!';
      const signature = await this.signer.signMessage(message);
      const pairs = [
        [ethers.zeroPadValue(this.signer.address, 20), signature],
        [ethers.zeroPadValue(this.wallet.target, 20), signature],
        [ethers.concat([this.verifier.target, VALID_SW_KEY_1]), VALID_SW_SIGNATURE_1],
      ].sort(([a], [b]) => ethers.keccak256(a) - ethers.keccak256(b));
      const signers = pairs.map(([signer]) => signer);
      const signatures = pairs.map(([, signature]) => signature);
      await expect(this.mock.$areValidSignaturesNow(ethers.hashMessage(message), signers, signatures)).to.eventually.be
        .true;
    });

    it('should validate multiple EOA signatures', async function () {
      const message = 'Helllo, World!';
      const pairs = [
        [ethers.zeroPadValue(this.signer.address, 20), await this.signer.signMessage(message)],
        [ethers.zeroPadValue(this.extraSigner.address, 20), await this.extraSigner.signMessage(message)],
      ].sort(([a], [b]) => ethers.keccak256(a) - ethers.keccak256(b));
      const signers = pairs.map(([signer]) => signer);
      const signatures = pairs.map(([, signature]) => signature);
      await expect(this.mock.$areValidSignaturesNow(ethers.hashMessage(message), signers, signatures)).to.eventually.be
        .true;
    });

    it('should validate multiple ERC-1271 wallet signatures', async function () {
      const message = 'Helllo, World!';
      const pairs = [
        [ethers.zeroPadValue(this.wallet.target, 20), await this.signer.signMessage(message)],
        [ethers.zeroPadValue(this.wallet2.target, 20), await this.extraSigner.signMessage(message)],
      ].sort(([a], [b]) => ethers.keccak256(a) - ethers.keccak256(b));
      const signers = pairs.map(([signer]) => signer);
      const signatures = pairs.map(([, signature]) => signature);
      await expect(this.mock.$areValidSignaturesNow(ethers.hashMessage(message), signers, signatures)).to.eventually.be
        .true;
    });

    it('should validate multiple ERC-7913 signatures', async function () {
      const pairs = [
        [ethers.concat([this.verifier.target, VALID_SW_KEY_1]), VALID_SW_SIGNATURE_1],
        [ethers.concat([this.verifier.target, VALID_SW_KEY_2]), VALID_SW_SIGNATURE_2],
      ].sort(([a], [b]) => ethers.keccak256(a) - ethers.keccak256(b));
      const signers = pairs.map(([signer]) => signer);
      const signatures = pairs.map(([, signature]) => signature);
      await expect(this.mock.$areValidSignaturesNow(ethers.hashMessage('Hello, World!'), signers, signatures)).to
        .eventually.be.true;
    });

    it('should return false if any signature is invalid', async function () {
      const message = 'Hello, World!';
      await expect(
        this.mock.$areValidSignaturesNow(
          ethers.hashMessage(message),
          [ethers.zeroPadValue(this.signer.address, 20), await this.extraSigner.signMessage(message)],
          [await this.signer.signMessage(message), await this.signer.signMessage('Nope')],
        ),
      ).to.eventually.be.false;
    });

    it('should return false if signers are not ordered by ID', async function () {
      const message = 'Hello, World!';
      const pairs = [
        [ethers.zeroPadValue(this.signer.address, 20), await this.signer.signMessage(message)],
        [ethers.zeroPadValue(this.extraSigner.address, 20), await this.extraSigner.signMessage(message)],
      ];

      if (ethers.keccak256(pairs[0][0]) - ethers.keccak256(pairs[1][0])) {
        pairs.reverse();
      }

      const signers = pairs.map(([signer]) => signer);
      const signatures = pairs.map(([, signature]) => signature);
      await expect(this.mock.$areValidSignaturesNow(ethers.hashMessage(message), signers, signatures)).to.eventually.be
        .false;
    });

    it('should return false if there are duplicate signers', async function () {
      const message = 'Hello, World!';
      await expect(
        this.mock.$areValidSignaturesNow(
          ethers.hashMessage(message),
          [ethers.zeroPadValue(this.signer.address, 20), ethers.zeroPadValue(this.signer.address, 20)], // Same signer used twice
          [await this.signer.signMessage(message), await this.signer.signMessage(message)],
        ),
      ).to.eventually.be.false;
    });

    it('should fail if signatures array length does not match signers array length', async function () {
      const message = 'Hello, World!';
      await expect(
        this.mock.$areValidSignaturesNow(
          ethers.hashMessage(message),
          [ethers.zeroPadValue(this.signer.address, 20), await this.extraSigner.signMessage(message)],
          [await this.signer.signMessage(message)], // Missing one signature
        ),
      ).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
    });

    it('should pass with empty arrays', async function () {
      await expect(this.mock.$areValidSignaturesNow(ethers.hashMessage('Hello, World!'), [], [])).to.eventually.be.true;
    });
  });
});
