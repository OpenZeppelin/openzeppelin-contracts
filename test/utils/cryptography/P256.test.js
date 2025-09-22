const { ethers } = require('hardhat');
const { expect } = require('chai');
const { secp256r1 } = require('@noble/curves/p256');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const N = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;

// As in ECDSA, signatures are malleable and the tooling produce both high and low S values.
// We need to ensure that the s value is in the lower half of the order of the curve.
const ensureLowerOrderS = ({ s, recovery, ...rest }) => {
  if (s > N / 2n) {
    s = N - s;
    recovery = 1 - recovery;
  }
  return { s, recovery, ...rest };
};

const prepareSignature = (
  privateKey = secp256r1.utils.randomPrivateKey(),
  messageHash = ethers.hexlify(ethers.randomBytes(0x20)),
) => {
  const publicKey = [
    secp256r1.getPublicKey(privateKey, false).slice(0x01, 0x21),
    secp256r1.getPublicKey(privateKey, false).slice(0x21, 0x41),
  ].map(ethers.hexlify);
  const { r, s, recovery } = ensureLowerOrderS(secp256r1.sign(messageHash.replace(/0x/, ''), privateKey));
  const signature = [r, s].map(v => ethers.toBeHex(v, 0x20));

  return { privateKey, publicKey, signature, recovery, messageHash };
};

describe('P256', function () {
  async function fixture() {
    return { mock: await ethers.deployContract('$P256') };
  }

  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('with signature', function () {
    beforeEach(async function () {
      Object.assign(this, prepareSignature());
    });

    it('verify valid signature', async function () {
      await expect(this.mock.$verify(this.messageHash, ...this.signature, ...this.publicKey)).to.eventually.be.true;
      await expect(this.mock.$verifySolidity(this.messageHash, ...this.signature, ...this.publicKey)).to.eventually.be
        .true;
      await expect(this.mock.$verifyNative(this.messageHash, ...this.signature, ...this.publicKey)).to.eventually.be
        .true;
    });

    it('verify improper signature', async function () {
      const signature = this.signature;
      this.signature[0] = ethers.toBeHex(N, 0x20); // r = N
      await expect(this.mock.$verify(this.messageHash, ...signature, ...this.publicKey)).to.eventually.be.false;
      await expect(this.mock.$verifySolidity(this.messageHash, ...signature, ...this.publicKey)).to.eventually.be.false;
      await expect(this.mock.$verifyNative(this.messageHash, ...signature, ...this.publicKey)).to.eventually.be.false;
    });

    it('recover public key', async function () {
      await expect(this.mock.$recovery(this.messageHash, this.recovery, ...this.signature)).to.eventually.deep.equal(
        this.publicKey,
      );
    });

    it('recovers (0,0) for invalid recovery bit', async function () {
      await expect(this.mock.$recovery(this.messageHash, 2, ...this.signature)).to.eventually.deep.equal([
        ethers.ZeroHash,
        ethers.ZeroHash,
      ]);
    });

    it('recovers (0,0) for improper signature', async function () {
      const signature = this.signature;
      this.signature[0] = ethers.toBeHex(N, 0x20); // r = N
      await expect(this.mock.$recovery(this.messageHash, this.recovery, ...signature)).to.eventually.deep.equal([
        ethers.ZeroHash,
        ethers.ZeroHash,
      ]);
    });

    it('reject signature with flipped public key coordinates ([x,y] >> [y,x])', async function () {
      // flip public key
      this.publicKey.reverse();

      await expect(this.mock.$verify(this.messageHash, ...this.signature, ...this.publicKey)).to.eventually.be.false;
      await expect(this.mock.$verifySolidity(this.messageHash, ...this.signature, ...this.publicKey)).to.eventually.be
        .false;
      await expect(this.mock.$verifyNative(this.messageHash, ...this.signature, ...this.publicKey)).to.eventually.be
        .false;
    });

    it('reject signature with flipped signature values ([r,s] >> [s,r])', async function () {
      // Preselected signature where `r < N/2` and `s < N/2`
      this.signature = [
        '0x45350225bad31e89db662fcc4fb2f79f349adbb952b3f652eed1f2aa72fb0356',
        '0x513eb68424c42630012309eee4a3b43e0bdc019d179ef0e0c461800845e237ee',
      ];

      // Corresponding hash and public key
      this.messageHash = '0x2ad1f900fe63745deeaedfdf396cb6f0f991c4338a9edf114d52f7d1812040a0';
      this.publicKey = [
        '0x9e30de165e521257996425d9bf12a7d366925614bf204eabbb78172b48e52e59',
        '0x94bf0fe72f99654d7beae4780a520848e306d46a1275b965c4f4c2b8e9a2c08d',
      ];

      // Make sure it works
      await expect(this.mock.$verify(this.messageHash, ...this.signature, ...this.publicKey)).to.eventually.be.true;

      // Flip signature
      this.signature.reverse();

      await expect(this.mock.$verify(this.messageHash, ...this.signature, ...this.publicKey)).to.eventually.be.false;
      await expect(this.mock.$verifySolidity(this.messageHash, ...this.signature, ...this.publicKey)).to.eventually.be
        .false;
      await expect(this.mock.$verifyNative(this.messageHash, ...this.signature, ...this.publicKey)).to.eventually.be
        .false;
      await expect(
        this.mock.$recovery(this.messageHash, this.recovery, ...this.signature),
      ).to.eventually.not.deep.equal(this.publicKey);
    });

    it('reject signature with invalid message hash', async function () {
      // random message hash
      this.messageHash = ethers.hexlify(ethers.randomBytes(32));

      await expect(this.mock.$verify(this.messageHash, ...this.signature, ...this.publicKey)).to.eventually.be.false;
      await expect(this.mock.$verifySolidity(this.messageHash, ...this.signature, ...this.publicKey)).to.eventually.be
        .false;
      await expect(this.mock.$verifyNative(this.messageHash, ...this.signature, ...this.publicKey)).to.eventually.be
        .false;
      await expect(
        this.mock.$recovery(this.messageHash, this.recovery, ...this.signature),
      ).to.eventually.not.deep.equal(this.publicKey);
    });

    it('fail to recover signature with invalid recovery bit', async function () {
      // flip recovery bit
      this.recovery = 1 - this.recovery;

      await expect(
        this.mock.$recovery(this.messageHash, this.recovery, ...this.signature),
      ).to.eventually.not.deep.equal(this.publicKey);
    });
  });

  // test cases for https://github.com/C2SP/wycheproof/blob/4672ff74d68766e7785c2cac4c597effccef2c5c/testvectors/ecdsa_secp256r1_sha256_p1363_test.json
  describe('wycheproof tests', function () {
    for (const { key, tests } of require('./ecdsa_secp256r1_sha256_p1363_test.json').testGroups) {
      // parse public key
      let [x, y] = [key.wx, key.wy].map(v => ethers.stripZerosLeft('0x' + v, 32));
      if (x.length > 66 || y.length > 66) continue;
      x = ethers.zeroPadValue(x, 32);
      y = ethers.zeroPadValue(y, 32);

      // run all tests for this key
      for (const { tcId, comment, msg, sig, result } of tests) {
        // only keep properly formatted signatures
        if (sig.length != 128) continue;

        it(`${tcId}: ${comment}`, async function () {
          // split signature, and reduce modulo N
          let [r, s] = Array(2)
            .fill()
            .map((_, i) => ethers.toBigInt('0x' + sig.substring(64 * i, 64 * (i + 1))));
          // move s to lower part of the curve if needed
          if (s <= N && s > N / 2n) s = N - s;
          // prepare signature
          r = ethers.toBeHex(r, 32);
          s = ethers.toBeHex(s, 32);
          // hash
          const messageHash = ethers.sha256('0x' + msg);

          // check verify
          await expect(this.mock.$verify(messageHash, r, s, x, y)).to.eventually.equal(result == 'valid');
        });
      }
    }
  });
});
