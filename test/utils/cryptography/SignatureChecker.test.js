import { network } from 'hardhat';
import { expect } from 'chai';
import * as precompile from '../../helpers/precompiles';
import * as random from '../../helpers/random';
import { P256SigningKey, NonNativeSigner } from '../../helpers/signers';
import {
  ERC7964_MAGIC,
  SetValue,
  ChainOperation,
  EIP712ChainDomain,
  encodeHeader,
  encodeSignature,
  getCrossChainDomain,
} from '../../helpers/erc7964';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.create();

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
          const signer = ethers.concat([this.verifier.target, random.bytes(32)]);
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
          const signature = random.bytes(65); // invalid (random) signature

          await expect(this.mock.$isValidSignatureNow(ethers.Typed.bytes(signer), TEST_MESSAGE_HASH, signature)).to
            .eventually.be.false;
        });

        it('with signer too short', async function () {
          const signer = random.bytes(19); // too short
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

const ERC7964_TYPES = { SetValue, ChainOperation, EIP712ChainDomain };
const VALUE = 42n;

async function erc7964Fixture() {
  const [signer, other] = await ethers.getSigners();
  const { chainId } = await ethers.provider.getNetwork();
  const mock = await ethers.deployContract('$SignatureChecker');
  const wallet = await ethers.deployContract('ERC1271WalletMock', [signer]);
  const app = await ethers.deployContract('ERC7964Mock', ['ERC7964Mock', '1']);
  const otherApp = await ethers.deployContract('ERC7964Mock', ['ERC7964Mock', '1']);
  const unrelatedApp = await ethers.deployContract('ERC7964Mock', ['Unrelated', '1']);

  // Operations for other chains, and for 2 applications on the current chain (at index 1 and 2)
  const operations = [
    { domain: { chainId: chainId + 1n, verifyingContract: random.address() }, value: VALUE },
    { domain: { chainId, verifyingContract: app.target }, value: VALUE },
    { domain: { chainId, verifyingContract: otherApp.target }, value: VALUE },
    { domain: { chainId: chainId + 2n, verifyingContract: random.address() }, value: VALUE },
  ];
  const structsArray = operations.map(op => ethers.TypedDataEncoder.hashStruct('ChainOperation', ERC7964_TYPES, op));

  return { signer, other, mock, wallet, app, otherApp, unrelatedApp, operations, structsArray };
}

describe('SignatureChecker (ERC7964)', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(erc7964Fixture));

    this.signCrossChain = async ({
      signer = this.signer,
      fields = '0x03',
      application = this.app,
      operations = this.operations,
      nonce = 0n,
    } = {}) =>
      signer.signTypedData(await getCrossChainDomain(application, fields), ERC7964_TYPES, { operations, nonce });

    this.encodeCrossChain = async ({
      fields = '0x03',
      structIndex = 1,
      application = this.app,
      structsArray = this.structsArray,
      crossChainSignature,
      ...signOptions
    } = {}) =>
      encodeSignature({
        header: encodeHeader({ fields, structIndex, application: application.target ?? application }),
        structsArray,
        crossChainSignature:
          crossChainSignature ?? (await this.signCrossChain({ fields, application, ...signOptions })),
      });
  });

  it('operation hash matches the struct hash of the current chain operation', async function () {
    await expect(this.app.operationHash(VALUE)).to.eventually.equal(this.structsArray[1]);
    await expect(this.otherApp.operationHash(VALUE)).to.eventually.equal(this.structsArray[2]);
  });

  describe('isValidCrossChainSignatureNow', function () {
    for (const fn of ['isValidSetValueSignature', 'isValidSetValueSignatureCalldata']) {
      describe(fn, function () {
        describe('with valid signature', function () {
          for (const fields of ['0x01', '0x03', '0x0b', '0x13', '0x1b']) {
            it(`with domain fields ${fields}`, async function () {
              const signature = await this.encodeCrossChain({ fields });
              await expect(this.app[fn](this.signer, VALUE, signature)).to.eventually.be.true;
            });
          }

          it('with ERC-1271 wallet signer', async function () {
            const signature = await this.encodeCrossChain();
            await expect(this.app[fn](this.wallet, VALUE, signature)).to.eventually.be.true;
          });

          it('with the same signature for another application on the same chain', async function () {
            const crossChainSignature = await this.signCrossChain();
            await expect(
              this.app[fn](this.signer, VALUE, await this.encodeCrossChain({ structIndex: 1, crossChainSignature })),
            ).to.eventually.be.true;
            await expect(
              this.otherApp[fn](
                this.signer,
                VALUE,
                await this.encodeCrossChain({ structIndex: 2, crossChainSignature }),
              ),
            ).to.eventually.be.true;
          });

          it('with application different from the verifying contract that returns the signed domain', async function () {
            const signature = await this.encodeCrossChain({ application: this.otherApp });
            await expect(this.app[fn](this.signer, VALUE, signature)).to.eventually.be.true;
          });
        });

        describe('with invalid signature', function () {
          it('with invalid signer', async function () {
            const signature = await this.encodeCrossChain();
            await expect(this.app[fn](this.other, VALUE, signature)).to.eventually.be.false;
          });

          it('with signature from another signer', async function () {
            const signature = await this.encodeCrossChain({ signer: this.other });
            await expect(this.app[fn](this.signer, VALUE, signature)).to.eventually.be.false;
          });

          it('with wrong value', async function () {
            const signature = await this.encodeCrossChain();
            await expect(this.app[fn](this.signer, VALUE + 1n, signature)).to.eventually.be.false;
          });

          it('with wrong message fields (nonce)', async function () {
            const signature = await this.encodeCrossChain();
            await this.app.setNonce(1n);
            await expect(this.app[fn](this.signer, VALUE, signature)).to.eventually.be.false;
          });

          it('with struct index pointing to another operation', async function () {
            for (const structIndex of [0, 2, 3]) {
              const signature = await this.encodeCrossChain({ structIndex });
              await expect(this.app[fn](this.signer, VALUE, signature)).to.eventually.be.false;
            }
          });

          it('with struct index out of bounds', async function () {
            for (const structIndex of [4, 0xffff]) {
              const signature = await this.encodeCrossChain({ structIndex });
              await expect(this.app[fn](this.signer, VALUE, signature)).to.eventually.be.false;
            }
          });

          it('with tampered structs array', async function () {
            const signature = await this.encodeCrossChain({
              structsArray: this.structsArray.map((hash, i) => (i == 0 ? ethers.ZeroHash : hash)),
              crossChainSignature: await this.signCrossChain(),
            });
            await expect(this.app[fn](this.signer, VALUE, signature)).to.eventually.be.false;
          });

          it('with fields that differ from the signed domain', async function () {
            const signature = await this.encodeCrossChain({
              fields: '0x01',
              crossChainSignature: await this.signCrossChain(),
            });
            await expect(this.app[fn](this.signer, VALUE, signature)).to.eventually.be.false;
          });

          it('with unsupported fields', async function () {
            for (const fields of ['0x20', '0x23', '0xff']) {
              const signature = await this.encodeCrossChain({
                fields,
                crossChainSignature: await this.signCrossChain(),
              });
              await expect(this.app[fn](this.signer, VALUE, signature)).to.eventually.be.false;
            }
          });

          it('with application that returns a different domain', async function () {
            const signature = await this.encodeCrossChain({
              application: this.unrelatedApp,
              crossChainSignature: await this.signCrossChain(),
            });
            await expect(this.app[fn](this.signer, VALUE, signature)).to.eventually.be.false;
          });

          it('with application that returns a different verifying contract', async function () {
            const signature = await this.encodeCrossChain({
              fields: '0x0b',
              application: this.otherApp,
              crossChainSignature: await this.signCrossChain({ fields: '0x0b' }),
            });
            await expect(this.app[fn](this.signer, VALUE, signature)).to.eventually.be.false;
          });

          it('with application without code', async function () {
            const signature = await this.encodeCrossChain({
              application: this.other.address,
              crossChainSignature: await this.signCrossChain(),
            });
            await expect(this.app[fn](this.signer, VALUE, signature)).to.eventually.be.false;
          });

          it('with application that reverts', async function () {
            const signature = await this.encodeCrossChain({
              application: this.mock, // does not implement ERC-5267
              crossChainSignature: await this.signCrossChain(),
            });
            await expect(this.app[fn](this.signer, VALUE, signature)).to.eventually.be.false;
          });

          it('with empty crosschain signature', async function () {
            const signature = await this.encodeCrossChain({ crossChainSignature: '0x' });
            await expect(this.app[fn](this.wallet, VALUE, signature)).to.eventually.be.false;
          });

          it('with invalid magic', async function () {
            const signature = encodeSignature({
              header: encodeHeader({
                magic: random.hexBytes(9),
                fields: '0x03',
                structIndex: 1,
                application: this.app.target,
              }),
              structsArray: this.structsArray,
              crossChainSignature: await this.signCrossChain(),
            });
            await expect(this.app[fn](this.signer, VALUE, signature)).to.eventually.be.false;
          });

          it('with regular signature', async function () {
            const signature = await this.signCrossChain();
            await expect(this.app[fn](this.signer, VALUE, signature)).to.eventually.be.false;
          });
        });
      });
    }
  });

  describe('tryParseCrossChainSignature', function () {
    const EMPTY = ['0x00', 0n, ethers.ZeroAddress, [], '0x'];

    // Replaces the 32 bytes word at `offset` in `data` with `value`
    const setWord = (data, offset, value) =>
      ethers.concat([
        ethers.dataSlice(data, 0, offset),
        ethers.toBeHex(value, 32),
        ethers.dataSlice(data, offset + 32),
      ]);

    beforeEach(async function () {
      this.crossChainSignature = await this.signCrossChain();
      this.header = encodeHeader({ fields: '0x03', structIndex: 1, application: this.app.target });
      this.signature = encodeSignature({
        header: this.header,
        structsArray: this.structsArray,
        crossChainSignature: this.crossChainSignature,
      });
      // Layout: header, structsArray offset, crossChainSignature offset, structsArray, crossChainSignature
      this.length = ethers.dataLength(this.signature);
      this.structsArrayOffset = 0x60;
      this.crossChainSignatureOffset = 0x80 + 0x20 * this.structsArray.length;
    });

    for (const fn of ['$tryParseCrossChainSignature', '$tryParseCrossChainSignatureCalldata']) {
      describe(fn, function () {
        const parse = (mock, signature) => mock[fn](signature).then(result => result.toArray(true));

        it('with valid signature', async function () {
          await expect(parse(this.mock, this.signature)).to.eventually.deep.equal([
            '0x03',
            1n,
            this.app.target,
            this.structsArray,
            this.crossChainSignature,
          ]);
        });

        it('with empty structs array and crosschain signature', async function () {
          const signature = encodeSignature({ header: this.header, structsArray: [], crossChainSignature: '0x' });
          expect(ethers.dataLength(signature)).to.equal(0xa0);
          await expect(parse(this.mock, signature)).to.eventually.deep.equal(['0x03', 1n, this.app.target, [], '0x']);
        });

        it('with trailing data and non-canonical gaps', async function () {
          // Move the crosschain signature 1 word further, leaving a gap after the structs array
          const signature = ethers.concat([
            setWord(
              ethers.dataSlice(this.signature, 0, this.crossChainSignatureOffset + 0x20),
              0x40,
              this.crossChainSignatureOffset + 0x20,
            ),
            ethers.dataSlice(this.signature, this.crossChainSignatureOffset),
            '0x1234',
          ]);
          await expect(parse(this.mock, signature)).to.eventually.deep.equal([
            '0x03',
            1n,
            this.app.target,
            this.structsArray,
            this.crossChainSignature,
          ]);
        });

        it('with signature too short', async function () {
          const signature = encodeSignature({ header: this.header, structsArray: [], crossChainSignature: '0x' });
          await expect(parse(this.mock, ethers.dataSlice(signature, 0, 0x9f))).to.eventually.deep.equal(EMPTY);
        });

        it('with invalid magic', async function () {
          for (const magic of [random.hexBytes(9), ethers.ZeroHash.slice(0, 20)]) {
            const signature = ethers.concat([magic, ethers.dataSlice(this.signature, 9)]);
            await expect(parse(this.mock, signature)).to.eventually.deep.equal(EMPTY);
          }
        });

        describe('with malformed encoding', function () {
          const cases = {
            'structs array offset within the head': ctx => setWord(ctx.signature, 0x20, 0x40),
            'structs array offset out of bounds': ctx => setWord(ctx.signature, 0x20, ctx.length - 0x1f),
            'structs array offset overflows': ctx => setWord(ctx.signature, 0x20, ethers.MaxUint256),
            'structs array length out of bounds': ctx =>
              setWord(ctx.signature, ctx.structsArrayOffset, Math.floor((ctx.length - 0x80) / 0x20) + 1),
            'structs array length overflows': ctx => setWord(ctx.signature, ctx.structsArrayOffset, ethers.MaxUint256),
            'structs array length overflows when multiplied': ctx =>
              setWord(ctx.signature, ctx.structsArrayOffset, ethers.MaxUint256 / 32n + 1n),
            'crosschain signature offset overlaps structs array': ctx =>
              setWord(ctx.signature, 0x40, ctx.crossChainSignatureOffset - 0x20),
            'crosschain signature offset out of bounds': ctx => setWord(ctx.signature, 0x40, ctx.length - 0x1f),
            'crosschain signature offset overflows': ctx => setWord(ctx.signature, 0x40, ethers.MaxUint256),
            'crosschain signature length out of bounds': ctx =>
              setWord(ctx.signature, ctx.crossChainSignatureOffset, ctx.length - ctx.crossChainSignatureOffset - 0x1f),
            'crosschain signature length overflows': ctx =>
              setWord(ctx.signature, ctx.crossChainSignatureOffset, ethers.MaxUint256),
          };

          for (const [name, malform] of Object.entries(cases)) {
            it(name, async function () {
              await expect(parse(this.mock, malform(this))).to.eventually.deep.equal(EMPTY);
            });
          }
        });
      });
    }
  });

  it('exposes the ERC-7964 magic value', async function () {
    await expect(this.mock.$ERC7964_MAGIC()).to.eventually.equal(ERC7964_MAGIC);
  });
});
