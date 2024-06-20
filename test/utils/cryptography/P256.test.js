const { ethers } = require('hardhat');
const { expect } = require('chai');
const { secp256r1 } = require('@noble/curves/p256');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const N = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;

const prepareSignature = (
  privateKey = secp256r1.utils.randomPrivateKey(),
  messageHash = ethers.hexlify(ethers.randomBytes(0x20)),
) => {
  const publicKey = [
    secp256r1.getPublicKey(privateKey, false).slice(0x01, 0x21),
    secp256r1.getPublicKey(privateKey, false).slice(0x21, 0x41),
  ].map(ethers.hexlify);
  const address = ethers.getAddress(ethers.keccak256(ethers.concat(publicKey)).slice(-40));
  const { r, s, recovery } = secp256r1.sign(messageHash.replace(/0x/, ''), privateKey);
  const signature = [r, s].map(v => ethers.toBeHex(v, 0x20));
  return { address, privateKey, publicKey, signature, recovery, messageHash };
};

describe('P256', function () {
  async function fixture() {
    return { mock: await ethers.deployContract('$P256') };
  }

  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture), prepareSignature());
  });

  it('derivate public from private', async function () {
    expect(await this.mock.$getPublicKey(ethers.toBigInt(this.privateKey))).to.deep.equal(this.publicKey);
  });

  it('verify valid signature', async function () {
    expect(await this.mock.$verify(this.messageHash, ...this.signature, ...this.publicKey)).to.be.true;
    expect(await this.mock.$verifySolidity(this.messageHash, ...this.signature, ...this.publicKey)).to.be.true;
    await expect(this.mock.$verify7212(this.messageHash, ...this.signature, ...this.publicKey))
      .to.be.revertedWithCustomError(this.mock, 'MissingPrecompile')
      .withArgs('0x0000000000000000000000000000000000000100');
  });

  it('recover public key', async function () {
    expect(await this.mock.$recovery(this.messageHash, this.recovery, ...this.signature)).to.deep.equal(this.publicKey);
  });

  it('recover address', async function () {
    expect(await this.mock.$recoveryAddress(this.messageHash, this.recovery, ...this.signature)).to.equal(this.address);
  });

  it('signatures are maleable', async function () {
    // symmetric S' = N - S
    this.signature[1] = ethers.toBeHex(N - ethers.toBigInt(this.signature[1]));
    this.recovery = 1 - this.recovery;

    expect(await this.mock.$verify(this.messageHash, ...this.signature, ...this.publicKey)).to.be.true;
    expect(await this.mock.$verifySolidity(this.messageHash, ...this.signature, ...this.publicKey)).to.be.true;
    await expect(this.mock.$verify7212(this.messageHash, ...this.signature, ...this.publicKey))
      .to.be.revertedWithCustomError(this.mock, 'MissingPrecompile')
      .withArgs('0x0000000000000000000000000000000000000100');
    expect(await this.mock.$recovery(this.messageHash, this.recovery, ...this.signature)).to.deep.equal(this.publicKey);
    expect(await this.mock.$recoveryAddress(this.messageHash, this.recovery, ...this.signature)).to.equal(this.address);
  });

  it('reject signature with flipped public key coordinates ([x,y] >> [y,x])', async function () {
    // flip public key
    this.publicKey.reverse();

    expect(await this.mock.$verify(this.messageHash, ...this.signature, ...this.publicKey)).to.be.false;
    expect(await this.mock.$verifySolidity(this.messageHash, ...this.signature, ...this.publicKey)).to.be.false;
    await expect(this.mock.$verify7212(this.messageHash, ...this.signature, ...this.publicKey))
      .to.be.revertedWithCustomError(this.mock, 'MissingPrecompile')
      .withArgs('0x0000000000000000000000000000000000000100');
  });

  it('reject signature with flipped signature values ([r,s] >> [s,r])', async function () {
    // flip public key
    this.signature.reverse();

    expect(await this.mock.$verify(this.messageHash, ...this.signature, ...this.publicKey)).to.be.false;
    expect(await this.mock.$verifySolidity(this.messageHash, ...this.signature, ...this.publicKey)).to.be.false;
    await expect(this.mock.$verify7212(this.messageHash, ...this.signature, ...this.publicKey))
      .to.be.revertedWithCustomError(this.mock, 'MissingPrecompile')
      .withArgs('0x0000000000000000000000000000000000000100');
    expect(await this.mock.$recovery(this.messageHash, this.recovery, ...this.signature)).to.not.deep.equal(
      this.publicKey,
    );
    expect(await this.mock.$recoveryAddress(this.messageHash, this.recovery, ...this.signature)).to.not.equal(
      this.address,
    );
  });

  it('reject signature with invalid message hash', async function () {
    // random message hash
    this.messageHash = ethers.hexlify(ethers.randomBytes(32));

    expect(await this.mock.$verify(this.messageHash, ...this.signature, ...this.publicKey)).to.be.false;
    expect(await this.mock.$verifySolidity(this.messageHash, ...this.signature, ...this.publicKey)).to.be.false;
    await expect(this.mock.$verify7212(this.messageHash, ...this.signature, ...this.publicKey))
      .to.be.revertedWithCustomError(this.mock, 'MissingPrecompile')
      .withArgs('0x0000000000000000000000000000000000000100');
    expect(await this.mock.$recovery(this.messageHash, this.recovery, ...this.signature)).to.not.deep.equal(
      this.publicKey,
    );
    expect(await this.mock.$recoveryAddress(this.messageHash, this.recovery, ...this.signature)).to.not.equal(
      this.address,
    );
  });

  it('fail to recover signature with invalid recovery bit', async function () {
    // flip recovery bit
    this.recovery = 1 - this.recovery;

    expect(await this.mock.$recovery(this.messageHash, this.recovery, ...this.signature)).to.not.deep.equal(
      this.publicKey,
    );
    expect(await this.mock.$recoveryAddress(this.messageHash, this.recovery, ...this.signature)).to.not.equal(
      this.address,
    );
  });
});
