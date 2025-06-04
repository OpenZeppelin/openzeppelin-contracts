const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const precompile = require('../../helpers/precompiles');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');

const TEST_MESSAGE = ethers.id('OpenZeppelin');
const TEST_MESSAGE_HASH = ethers.hashMessage(TEST_MESSAGE);

const WRONG_MESSAGE = ethers.id('Nope');
const WRONG_MESSAGE_HASH = ethers.hashMessage(WRONG_MESSAGE);

const VALID_SW_KEY_1 = ethers.toUtf8Bytes('valid_key_1');
const VALID_SW_KEY_2 = ethers.toUtf8Bytes('valid_key_2');

const VALID_SW_SIGNATURE_1 = ethers.toUtf8Bytes('valid_signature_1');
const VALID_SW_SIGNATURE_2 = ethers.toUtf8Bytes('valid_signature_2');

async function fixture() {
  const [signer, extraSigner, other] = await ethers.getSigners();
  const mock = await ethers.deployContract('$SignatureChecker');
  const wallet = await ethers.deployContract('ERC1271WalletMock', [signer]);
  const wallet2 = await ethers.deployContract('ERC1271WalletMock', [extraSigner]);
  const malicious = await ethers.deployContract('ERC1271MaliciousMock');
  const signature = await signer.signMessage(TEST_MESSAGE);
  const verifier = await ethers.deployContract('ERC7913VerifierMock');

  return { signer, other, extraSigner, mock, wallet, wallet2, malicious, signature, verifier };
}

describe('SignatureChecker (ERC1271)', function () {
  before('deploying', async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('EOA account', function () {
    it('with matching signer and signature', async function () {
      await expect(this.mock.$isValidSignatureNow(this.signer, TEST_MESSAGE_HASH, this.signature)).to.eventually.be
        .true;
    });

    it('with invalid signer', async function () {
      await expect(this.mock.$isValidSignatureNow(this.other, TEST_MESSAGE_HASH, this.signature)).to.eventually.be
        .false;
    });

    it('with invalid signature', async function () {
      await expect(this.mock.$isValidSignatureNow(this.signer, WRONG_MESSAGE_HASH, this.signature)).to.eventually.be
        .false;
    });
  });

  describe('ERC1271 wallet', function () {
    for (const fn of ['isValidERC1271SignatureNow', 'isValidSignatureNow']) {
      describe(fn, function () {
        it('with matching signer and signature', async function () {
          await expect(this.mock.getFunction(`$${fn}`)(this.wallet, TEST_MESSAGE_HASH, this.signature)).to.eventually.be
            .true;
        });

        it('with invalid signer', async function () {
          await expect(this.mock.getFunction(`$${fn}`)(this.mock, TEST_MESSAGE_HASH, this.signature)).to.eventually.be
            .false;
        });

        it('with identity precompile', async function () {
          await expect(this.mock.getFunction(`$${fn}`)(precompile.identity, TEST_MESSAGE_HASH, this.signature)).to
            .eventually.be.false;
        });

        it('with invalid signature', async function () {
          await expect(this.mock.getFunction(`$${fn}`)(this.wallet, WRONG_MESSAGE_HASH, this.signature)).to.eventually
            .be.false;
        });

        it('with malicious wallet', async function () {
          await expect(this.mock.getFunction(`$${fn}`)(this.malicious, TEST_MESSAGE_HASH, this.signature)).to.eventually
            .be.false;
        });
      });
    }
  });

  describe('ERC7913', function () {
    describe('isValidERC7913SignatureNow', function () {
      describe('with EOA signer', function () {
        it('with matching signer and signature', async function () {
          const eoaSigner = ethers.zeroPadValue(this.signer.address, 20);
          const signature = await this.signer.signMessage(TEST_MESSAGE);
          await expect(this.mock.$isValidERC7913SignatureNow(eoaSigner, TEST_MESSAGE_HASH, signature)).to.eventually.be
            .true;
        });

        it('with invalid signer', async function () {
          const eoaSigner = ethers.zeroPadValue(this.other.address, 20);
          const signature = await this.signer.signMessage(TEST_MESSAGE);
          await expect(this.mock.$isValidERC7913SignatureNow(eoaSigner, TEST_MESSAGE_HASH, signature)).to.eventually.be
            .false;
        });

        it('with invalid signature', async function () {
          const eoaSigner = ethers.zeroPadValue(this.signer.address, 20);
          const signature = await this.signer.signMessage(TEST_MESSAGE);
          await expect(this.mock.$isValidERC7913SignatureNow(eoaSigner, WRONG_MESSAGE_HASH, signature)).to.eventually.be
            .false;
        });
      });

      describe('with ERC-1271 wallet', function () {
        it('with matching signer and signature', async function () {
          const walletSigner = ethers.zeroPadValue(this.wallet.target, 20);
          const signature = await this.signer.signMessage(TEST_MESSAGE);
          await expect(this.mock.$isValidERC7913SignatureNow(walletSigner, TEST_MESSAGE_HASH, signature)).to.eventually
            .be.true;
        });

        it('with invalid signer', async function () {
          const walletSigner = ethers.zeroPadValue(this.mock.target, 20);
          const signature = await this.signer.signMessage(TEST_MESSAGE);
          await expect(this.mock.$isValidERC7913SignatureNow(walletSigner, TEST_MESSAGE_HASH, signature)).to.eventually
            .be.false;
        });

        it('with invalid signature', async function () {
          const walletSigner = ethers.zeroPadValue(this.wallet.target, 20);
          const signature = await this.signer.signMessage(TEST_MESSAGE);
          await expect(this.mock.$isValidERC7913SignatureNow(walletSigner, WRONG_MESSAGE_HASH, signature)).to.eventually
            .be.false;
        });
      });

      describe('with ERC-7913 verifier', function () {
        it('with matching signer and signature', async function () {
          await expect(
            this.mock.$isValidERC7913SignatureNow(
              ethers.concat([this.verifier.target, VALID_SW_KEY_1]),
              TEST_MESSAGE_HASH,
              VALID_SW_SIGNATURE_1,
            ),
          ).to.eventually.be.true;
        });

        it('with invalid verifier', async function () {
          const invalidVerifierSigner = ethers.concat([this.mock.target, VALID_SW_KEY_1]);
          await expect(
            this.mock.$isValidERC7913SignatureNow(invalidVerifierSigner, TEST_MESSAGE_HASH, VALID_SW_SIGNATURE_1),
          ).to.eventually.be.false;
        });

        it('with invalid key', async function () {
          await expect(
            this.mock.$isValidERC7913SignatureNow(
              ethers.concat([this.verifier.target, ethers.randomBytes(32)]),
              TEST_MESSAGE_HASH,
              VALID_SW_SIGNATURE_1,
            ),
          ).to.eventually.be.false;
        });

        it('with invalid signature', async function () {
          await expect(
            this.mock.$isValidERC7913SignatureNow(
              ethers.concat([this.verifier.target, VALID_SW_KEY_1]),
              TEST_MESSAGE_HASH,
              ethers.randomBytes(65),
            ),
          ).to.eventually.be.false;
        });

        it('with signer too short', async function () {
          const shortSigner = ethers.randomBytes(19);
          await expect(this.mock.$isValidERC7913SignatureNow(shortSigner, TEST_MESSAGE_HASH, VALID_SW_SIGNATURE_1)).to
            .eventually.be.false;
        });
      });
    });

    describe('areValidERC7913SignaturesNow', function () {
      it('should validate a single signature', async function () {
        const signature = await this.signer.signMessage(TEST_MESSAGE);
        await expect(
          this.mock.$areValidERC7913SignaturesNow(
            TEST_MESSAGE_HASH,
            [ethers.zeroPadValue(this.signer.address, 20)],
            [signature],
          ),
        ).to.eventually.be.true;
      });

      it('should validate multiple signatures with different signer types', async function () {
        const signature = await this.signer.signMessage(TEST_MESSAGE);
        const pairs = [
          { signer: ethers.zeroPadValue(this.signer.address, 20), signature },
          { signer: ethers.zeroPadValue(this.wallet.target, 20), signature },
          { signer: ethers.concat([this.verifier.target, VALID_SW_KEY_1]), signature: VALID_SW_SIGNATURE_1 },
        ].sort(({ signer: a }, { signer: b }) => ethers.keccak256(a) - ethers.keccak256(b));

        await expect(
          this.mock.$areValidERC7913SignaturesNow(
            TEST_MESSAGE_HASH,
            pairs.map(({ signer }) => signer),
            pairs.map(({ signature }) => signature),
          ),
        ).to.eventually.be.true;
      });

      it('should validate multiple EOA signatures', async function () {
        const pairs = [
          {
            signer: ethers.zeroPadValue(this.signer.address, 20),
            signature: await this.signer.signMessage(TEST_MESSAGE),
          },
          {
            signer: ethers.zeroPadValue(this.extraSigner.address, 20),
            signature: await this.extraSigner.signMessage(TEST_MESSAGE),
          },
        ].sort(({ signer: a }, { signer: b }) => ethers.keccak256(a) - ethers.keccak256(b));

        await expect(
          this.mock.$areValidERC7913SignaturesNow(
            TEST_MESSAGE_HASH,
            pairs.map(({ signer }) => signer),
            pairs.map(({ signature }) => signature),
          ),
        ).to.eventually.be.true;
      });

      it('should validate multiple ERC-1271 wallet signatures', async function () {
        const pairs = [
          {
            signer: ethers.zeroPadValue(this.wallet.target, 20),
            signature: await this.signer.signMessage(TEST_MESSAGE),
          },
          {
            signer: ethers.zeroPadValue(this.wallet2.target, 20),
            signature: await this.extraSigner.signMessage(TEST_MESSAGE),
          },
        ].sort(({ signer: a }, { signer: b }) => ethers.keccak256(a) - ethers.keccak256(b));

        await expect(
          this.mock.$areValidERC7913SignaturesNow(
            TEST_MESSAGE_HASH,
            pairs.map(({ signer }) => signer),
            pairs.map(({ signature }) => signature),
          ),
        ).to.eventually.be.true;
      });

      it('should validate multiple ERC-7913 signatures (ordered by ID)', async function () {
        const pairs = [
          { signer: ethers.concat([this.verifier.target, VALID_SW_KEY_1]), signature: VALID_SW_SIGNATURE_1 },
          { signer: ethers.concat([this.verifier.target, VALID_SW_KEY_2]), signature: VALID_SW_SIGNATURE_2 },
        ].sort(({ signer: a }, { signer: b }) => ethers.keccak256(a) - ethers.keccak256(b));

        await expect(
          this.mock.$areValidERC7913SignaturesNow(
            TEST_MESSAGE_HASH,
            pairs.map(({ signer }) => signer),
            pairs.map(({ signature }) => signature),
          ),
        ).to.eventually.be.true;
      });

      it('should validate multiple ERC-7913 signatures (unordered)', async function () {
        const pairs = [
          { signer: ethers.concat([this.verifier.target, VALID_SW_KEY_1]), signature: VALID_SW_SIGNATURE_1 },
          { signer: ethers.concat([this.verifier.target, VALID_SW_KEY_2]), signature: VALID_SW_SIGNATURE_2 },
        ].sort(({ signer: a }, { signer: b }) => ethers.keccak256(b) - ethers.keccak256(a)); // reverse

        await expect(
          this.mock.$areValidERC7913SignaturesNow(
            TEST_MESSAGE_HASH,
            pairs.map(({ signer }) => signer),
            pairs.map(({ signature }) => signature),
          ),
        ).to.eventually.be.true;
      });

      it('should return false if any signature is invalid', async function () {
        await expect(
          this.mock.$areValidERC7913SignaturesNow(
            TEST_MESSAGE_HASH,
            [ethers.zeroPadValue(this.signer.address, 20), await this.extraSigner.signMessage(TEST_MESSAGE)],
            [await this.signer.signMessage(TEST_MESSAGE), await this.signer.signMessage(WRONG_MESSAGE)],
          ),
        ).to.eventually.be.false;
      });

      it('should return false if there are duplicate signers', async function () {
        await expect(
          this.mock.$areValidERC7913SignaturesNow(
            TEST_MESSAGE_HASH,
            [ethers.zeroPadValue(this.signer.address, 20), ethers.zeroPadValue(this.signer.address, 20)], // Same signer used twice
            [await this.signer.signMessage(TEST_MESSAGE), await this.signer.signMessage(TEST_MESSAGE)],
          ),
        ).to.eventually.be.false;
      });

      it('should fail if signatures array length does not match signers array length', async function () {
        await expect(
          this.mock.$areValidERC7913SignaturesNow(
            TEST_MESSAGE_HASH,
            [ethers.zeroPadValue(this.signer.address, 20), await this.extraSigner.signMessage(TEST_MESSAGE)],
            [await this.signer.signMessage(TEST_MESSAGE)], // Missing one signature
          ),
        ).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
      });

      it('should pass with empty arrays', async function () {
        await expect(this.mock.$areValidERC7913SignaturesNow(TEST_MESSAGE_HASH, [], [])).to.eventually.be.true;
      });
    });
  });
});
