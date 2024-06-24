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
    Object.assign(this, await loadFixture(fixture), prepareSignature());
  });

  it('verify valid signature', async function () {
    expect(await this.mock.$verify(this.messageHash, ...this.signature, ...this.publicKey)).to.be.true;
    expect(await this.mock.$verifySolidity(this.messageHash, ...this.signature, ...this.publicKey)).to.be.true;
    await expect(this.mock.$verifyNative(this.messageHash, ...this.signature, ...this.publicKey))
      .to.be.revertedWithCustomError(this.mock, 'MissingPrecompile')
      .withArgs('0x0000000000000000000000000000000000000100');
  });

  it('recover public key', async function () {
    expect(await this.mock.$recovery(this.messageHash, this.recovery, ...this.signature)).to.deep.equal(this.publicKey);
  });

  it('reject signature with flipped public key coordinates ([x,y] >> [y,x])', async function () {
    // flip public key
    this.publicKey.reverse();

    expect(await this.mock.$verify(this.messageHash, ...this.signature, ...this.publicKey)).to.be.false;
    expect(await this.mock.$verifySolidity(this.messageHash, ...this.signature, ...this.publicKey)).to.be.false;
    expect(await this.mock.$verifyNative(this.messageHash, ...this.signature, ...this.publicKey)).to.be.false; // Flipped public key is not in the curve
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
    expect(await this.mock.$verify(this.messageHash, ...this.signature, ...this.publicKey)).to.be.true;

    // Flip signature
    this.signature.reverse();

    expect(await this.mock.$verify(this.messageHash, ...this.signature, ...this.publicKey)).to.be.false;
    expect(await this.mock.$verifySolidity(this.messageHash, ...this.signature, ...this.publicKey)).to.be.false;
    await expect(this.mock.$verifyNative(this.messageHash, ...this.signature, ...this.publicKey))
      .to.be.revertedWithCustomError(this.mock, 'MissingPrecompile')
      .withArgs('0x0000000000000000000000000000000000000100');
    expect(await this.mock.$recovery(this.messageHash, this.recovery, ...this.signature)).to.not.deep.equal(
      this.publicKey,
    );
  });

  it('reject signature with invalid message hash', async function () {
    // random message hash
    this.messageHash = ethers.hexlify(ethers.randomBytes(32));

    expect(await this.mock.$verify(this.messageHash, ...this.signature, ...this.publicKey)).to.be.false;
    expect(await this.mock.$verifySolidity(this.messageHash, ...this.signature, ...this.publicKey)).to.be.false;
    await expect(this.mock.$verifyNative(this.messageHash, ...this.signature, ...this.publicKey))
      .to.be.revertedWithCustomError(this.mock, 'MissingPrecompile')
      .withArgs('0x0000000000000000000000000000000000000100');
    expect(await this.mock.$recovery(this.messageHash, this.recovery, ...this.signature)).to.not.deep.equal(
      this.publicKey,
    );
  });

  it('fail to recover signature with invalid recovery bit', async function () {
    // flip recovery bit
    this.recovery = 1 - this.recovery;

    expect(await this.mock.$recovery(this.messageHash, this.recovery, ...this.signature)).to.not.deep.equal(
      this.publicKey,
    );
  });
});
