const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const precompile = require('../../helpers/precompiles');
const { P256SigningKey, NonNativeSigner } = require('../../helpers/signers');

const TEST_MESSAGE = ethers.id('OpenZeppelin');
const TEST_MESSAGE_HASH = ethers.hashMessage(TEST_MESSAGE);

const WRONG_MESSAGE = ethers.id('Nope');
const WRONG_MESSAGE_HASH = ethers.hashMessage(WRONG_MESSAGE);

const aliceP256 = new NonNativeSigner(P256SigningKey.random());
const bobP256 = new NonNativeSigner(P256SigningKey.random());

async function fixture() {
  const [signer, extraSigner, other] = await ethers.getSigners();
  const mock = await ethers.deployContract('$SignatureChecker');
  const wallet = await ethers.deployContract('ERC1271WalletMock', [signer]);
  const wallet2 = await ethers.deployContract('ERC1271WalletMock', [extraSigner]);
  const malicious = await ethers.deployContract('ERC1271MaliciousMock');
  const signature = await signer.signMessage(TEST_MESSAGE);
  const verifier = await ethers.deployContract('ERC7913P256Verifier');

  return { signer, other, extraSigner, mock, wallet, wallet2, malicious, signature, verifier };
}

describe('SignatureChecker (ERC1271)', function () {
  before('deploying', async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('EOA account', function () {
    it('with matching signer and signature', async function () {
      await expect(
        this.mock.$isValidSignatureNow(ethers.Typed.address(this.signer.address), TEST_MESSAGE_HASH, this.signature),
      ).to.eventually.be.true;
      await expect(this.mock.$isValidSignatureNowCalldata(this.signer.address, TEST_MESSAGE_HASH, this.signature)).to
        .eventually.be.true;
    });

    it('with invalid signer', async function () {
      await expect(
        this.mock.$isValidSignatureNow(ethers.Typed.address(this.other.address), TEST_MESSAGE_HASH, this.signature),
      ).to.eventually.be.false;
      await expect(this.mock.$isValidSignatureNowCalldata(this.other.address, TEST_MESSAGE_HASH, this.signature)).to
        .eventually.be.false;
    });

    it('with invalid signature', async function () {
      await expect(
        this.mock.$isValidSignatureNow(ethers.Typed.address(this.signer.address), WRONG_MESSAGE_HASH, this.signature),
      ).to.eventually.be.false;
      await expect(this.mock.$isValidSignatureNowCalldata(this.signer.address, WRONG_MESSAGE_HASH, this.signature)).to
        .eventually.be.false;
    });
  });

  describe('ERC1271 wallet', function () {
    for (const fn of [
      'isValidERC1271SignatureNow',
      'isValidERC1271SignatureNowCalldata',
      'isValidSignatureNow',
      'isValidSignatureNowCalldata',
    ]) {
      describe(fn, function () {
        it('with matching signer and signature', async function () {
          await expect(
            this.mock.getFunction(`$${fn}`)(
              ethers.Typed.address(this.wallet.target),
              TEST_MESSAGE_HASH,
              this.signature,
            ),
          ).to.eventually.be.true;
        });

        it('with invalid signer', async function () {
          await expect(
            this.mock.getFunction(`$${fn}`)(ethers.Typed.address(this.mock.target), TEST_MESSAGE_HASH, this.signature),
          ).to.eventually.be.false;
        });

        it('with identity precompile', async function () {
          await expect(
            this.mock.getFunction(`$${fn}`)(
              ethers.Typed.address(precompile.identity),
              TEST_MESSAGE_HASH,
              this.signature,
            ),
          ).to.eventually.be.false;
        });

        it('with invalid signature', async function () {
          await expect(
            this.mock.getFunction(`$${fn}`)(
              ethers.Typed.address(this.wallet.target),
              WRONG_MESSAGE_HASH,
              this.signature,
            ),
          ).to.eventually.be.false;
        });

        it('with malicious wallet', async function () {
          await expect(
            this.mock.getFunction(`$${fn}`)(
              ethers.Typed.address(this.malicious.target),
              TEST_MESSAGE_HASH,
              this.signature,
            ),
          ).to.eventually.be.false;
        });
      });
    }
  });

  describe('ERC7913', function () {
    describe('isValidSignatureNow', function () {
      describe('with EOA signer', function () {
        it('with matching signer and signature', async function () {
          const eoaSigner = ethers.zeroPadValue(this.signer.address, 20);
          const signature = await this.signer.signMessage(TEST_MESSAGE);
          await expect(this.mock.$isValidSignatureNow(ethers.Typed.bytes(eoaSigner), TEST_MESSAGE_HASH, signature)).to
            .eventually.be.true;
        });

        it('with invalid signer', async function () {
          const eoaSigner = ethers.zeroPadValue(this.other.address, 20);
          const signature = await this.signer.signMessage(TEST_MESSAGE);
          await expect(this.mock.$isValidSignatureNow(ethers.Typed.bytes(eoaSigner), TEST_MESSAGE_HASH, signature)).to
            .eventually.be.false;
        });

        it('with invalid signature', async function () {
          const eoaSigner = ethers.zeroPadValue(this.signer.address, 20);
          const signature = await this.signer.signMessage(TEST_MESSAGE);
          await expect(this.mock.$isValidSignatureNow(ethers.Typed.bytes(eoaSigner), WRONG_MESSAGE_HASH, signature)).to
            .eventually.be.false;
        });
      });

      describe('with ERC-1271 wallet', function () {
        it('with matching signer and signature', async function () {
          const walletSigner = ethers.zeroPadValue(this.wallet.target, 20);
          const signature = await this.signer.signMessage(TEST_MESSAGE);
          await expect(this.mock.$isValidSignatureNow(ethers.Typed.bytes(walletSigner), TEST_MESSAGE_HASH, signature))
            .to.eventually.be.true;
        });

        it('with invalid signer', async function () {
          const walletSigner = ethers.zeroPadValue(this.mock.target, 20);
          const signature = await this.signer.signMessage(TEST_MESSAGE);
          await expect(this.mock.$isValidSignatureNow(ethers.Typed.bytes(walletSigner), TEST_MESSAGE_HASH, signature))
            .to.eventually.be.false;
        });

        it('with invalid signature', async function () {
          const walletSigner = ethers.zeroPadValue(this.wallet.target, 20);
          const signature = await this.signer.signMessage(TEST_MESSAGE);
          await expect(this.mock.$isValidSignatureNow(ethers.Typed.bytes(walletSigner), WRONG_MESSAGE_HASH, signature))
            .to.eventually.be.false;
        });
      });

      describe('with ERC-7913 verifier', function () {
        it('with matching signer and signature', async function () {
          const signer = ethers.concat([
            this.verifier.target,
            aliceP256.signingKey.publicKey.qx,
            aliceP256.signingKey.publicKey.qy,
          ]);
          const signature = await aliceP256.signMessage(TEST_MESSAGE);

          await expect(this.mock.$isValidSignatureNow(ethers.Typed.bytes(signer), TEST_MESSAGE_HASH, signature)).to
            .eventually.be.true;
        });

        it('with invalid verifier', async function () {
          const signer = ethers.concat([
            this.mock.target, // invalid verifier
            aliceP256.signingKey.publicKey.qx,
            aliceP256.signingKey.publicKey.qy,
          ]);
          const signature = await aliceP256.signMessage(TEST_MESSAGE);

          await expect(this.mock.$isValidSignatureNow(ethers.Typed.bytes(signer), TEST_MESSAGE_HASH, signature)).to
            .eventually.be.false;
        });

        it('with invalid key', async function () {
          const signer = ethers.concat([this.verifier.target, ethers.randomBytes(32)]);
          const signature = await aliceP256.signMessage(TEST_MESSAGE);

          await expect(this.mock.$isValidSignatureNow(ethers.Typed.bytes(signer), TEST_MESSAGE_HASH, signature)).to
            .eventually.be.false;
        });

        it('with invalid signature', async function () {
          const signer = ethers.concat([
            this.verifier.target,
            aliceP256.signingKey.publicKey.qx,
            aliceP256.signingKey.publicKey.qy,
          ]);
          const signature = ethers.randomBytes(65); // invalid (random) signature

          await expect(this.mock.$isValidSignatureNow(ethers.Typed.bytes(signer), TEST_MESSAGE_HASH, signature)).to
            .eventually.be.false;
        });

        it('with signer too short', async function () {
          const signer = ethers.randomBytes(19); // too short
          const signature = await aliceP256.signMessage(TEST_MESSAGE);
          await expect(this.mock.$isValidSignatureNow(ethers.Typed.bytes(signer), TEST_MESSAGE_HASH, signature)).to
            .eventually.be.false;
        });
      });
    });

    describe('areValidSignaturesNow', function () {
      const sortSigners = (...signers) =>
        signers.sort(({ signer: a }, { signer: b }) => ethers.keccak256(b) - ethers.keccak256(a));

      it('should validate a single signature', async function () {
        const signer = ethers.zeroPadValue(this.signer.address, 20);
        const signature = await this.signer.signMessage(TEST_MESSAGE);

        await expect(this.mock.$areValidSignaturesNow(TEST_MESSAGE_HASH, [signer], [signature])).to.eventually.be.true;
      });

      it('should validate multiple signatures with different signer types', async function () {
        const signers = sortSigners(
          {
            signer: ethers.zeroPadValue(this.signer.address, 20),
            signature: await this.signer.signMessage(TEST_MESSAGE),
          },
          {
            signer: ethers.zeroPadValue(this.wallet.target, 20),
            signature: await this.signer.signMessage(TEST_MESSAGE),
          },
          {
            signer: ethers.concat([
              this.verifier.target,
              aliceP256.signingKey.publicKey.qx,
              aliceP256.signingKey.publicKey.qy,
            ]),
            signature: await aliceP256.signMessage(TEST_MESSAGE),
          },
        );

        await expect(
          this.mock.$areValidSignaturesNow(
            TEST_MESSAGE_HASH,
            signers.map(({ signer }) => signer),
            signers.map(({ signature }) => signature),
          ),
        ).to.eventually.be.true;
      });

      it('should validate multiple EOA signatures', async function () {
        const signers = sortSigners(
          {
            signer: ethers.zeroPadValue(this.signer.address, 20),
            signature: await this.signer.signMessage(TEST_MESSAGE),
          },
          {
            signer: ethers.zeroPadValue(this.extraSigner.address, 20),
            signature: await this.extraSigner.signMessage(TEST_MESSAGE),
          },
        );

        await expect(
          this.mock.$areValidSignaturesNow(
            TEST_MESSAGE_HASH,
            signers.map(({ signer }) => signer),
            signers.map(({ signature }) => signature),
          ),
        ).to.eventually.be.true;
      });

      it('should validate multiple ERC-1271 wallet signatures', async function () {
        const signers = sortSigners(
          {
            signer: ethers.zeroPadValue(this.wallet.target, 20),
            signature: await this.signer.signMessage(TEST_MESSAGE),
          },
          {
            signer: ethers.zeroPadValue(this.wallet2.target, 20),
            signature: await this.extraSigner.signMessage(TEST_MESSAGE),
          },
        );

        await expect(
          this.mock.$areValidSignaturesNow(
            TEST_MESSAGE_HASH,
            signers.map(({ signer }) => signer),
            signers.map(({ signature }) => signature),
          ),
        ).to.eventually.be.true;
      });

      it('should validate multiple ERC-7913 signatures (ordered by ID)', async function () {
        const signers = sortSigners(
          {
            signer: ethers.concat([
              this.verifier.target,
              aliceP256.signingKey.publicKey.qx,
              aliceP256.signingKey.publicKey.qy,
            ]),
            signature: await aliceP256.signMessage(TEST_MESSAGE),
          },
          {
            signer: ethers.concat([
              this.verifier.target,
              bobP256.signingKey.publicKey.qx,
              bobP256.signingKey.publicKey.qy,
            ]),
            signature: await bobP256.signMessage(TEST_MESSAGE),
          },
        );

        await expect(
          this.mock.$areValidSignaturesNow(
            TEST_MESSAGE_HASH,
            signers.map(({ signer }) => signer),
            signers.map(({ signature }) => signature),
          ),
        ).to.eventually.be.true;
      });

      it('should validate multiple ERC-7913 signatures (unordered)', async function () {
        const signers = sortSigners(
          {
            signer: ethers.concat([
              this.verifier.target,
              aliceP256.signingKey.publicKey.qx,
              aliceP256.signingKey.publicKey.qy,
            ]),
            signature: await aliceP256.signMessage(TEST_MESSAGE),
          },
          {
            signer: ethers.concat([
              this.verifier.target,
              bobP256.signingKey.publicKey.qx,
              bobP256.signingKey.publicKey.qy,
            ]),
            signature: await bobP256.signMessage(TEST_MESSAGE),
          },
        ).reverse(); // reverse

        await expect(
          this.mock.$areValidSignaturesNow(
            TEST_MESSAGE_HASH,
            signers.map(({ signer }) => signer),
            signers.map(({ signature }) => signature),
          ),
        ).to.eventually.be.true;
      });

      it('should return false if any signature is invalid', async function () {
        const signers = sortSigners(
          {
            signer: ethers.zeroPadValue(this.signer.address, 20),
            signature: await this.signer.signMessage(TEST_MESSAGE),
          },
          {
            signer: ethers.zeroPadValue(this.extraSigner.address, 20),
            signature: await this.extraSigner.signMessage(WRONG_MESSAGE),
          },
        );

        await expect(
          this.mock.$areValidSignaturesNow(
            TEST_MESSAGE_HASH,
            signers.map(({ signer }) => signer),
            signers.map(({ signature }) => signature),
          ),
        ).to.eventually.be.false;
      });

      it('should return false if there are duplicate signers', async function () {
        const signers = sortSigners(
          {
            signer: ethers.zeroPadValue(this.signer.address, 20),
            signature: await this.signer.signMessage(TEST_MESSAGE),
          },
          {
            signer: ethers.zeroPadValue(this.signer.address, 20),
            signature: await this.signer.signMessage(TEST_MESSAGE),
          },
        );

        await expect(
          this.mock.$areValidSignaturesNow(
            TEST_MESSAGE_HASH,
            signers.map(({ signer }) => signer),
            signers.map(({ signature }) => signature),
          ),
        ).to.eventually.be.false;
      });

      it('should return false if signatures array length does not match signers array length', async function () {
        const signers = sortSigners(
          {
            signer: ethers.zeroPadValue(this.signer.address, 20),
            signature: await this.signer.signMessage(TEST_MESSAGE),
          },
          {
            signer: ethers.zeroPadValue(this.extraSigner.address, 20),
            signature: await this.extraSigner.signMessage(TEST_MESSAGE),
          },
        );

        await expect(
          this.mock.$areValidSignaturesNow(
            TEST_MESSAGE_HASH,
            signers.map(({ signer }) => signer),
            signers.map(({ signature }) => signature).slice(1),
          ),
        ).to.eventually.be.false;
      });

      it('should pass with empty arrays', async function () {
        await expect(this.mock.$areValidSignaturesNow(TEST_MESSAGE_HASH, [], [])).to.eventually.be.true;
      });
    });
  });
});
