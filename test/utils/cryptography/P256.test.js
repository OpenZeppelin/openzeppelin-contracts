const { ethers } = require('hardhat');
const { expect } = require('chai');
const { secp256r1 } = require('@noble/curves/p256');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

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
  });

  it('recover public key', async function () {
    expect(await this.mock.$recovery(this.messageHash, this.recovery, ...this.signature)).to.deep.equal(this.publicKey);
  });

  it('recover address', async function () {
    expect(await this.mock.$recoveryAddress(this.messageHash, this.recovery, ...this.signature)).to.equal(this.address);
  });

  it('reject signature with flipped public key coordinates ([x,y] >> [y,x])', async function () {
    const reversedPublicKey = Array.from(this.publicKey).reverse();
    expect(await this.mock.$verify(this.messageHash, ...this.signature, ...reversedPublicKey)).to.be.false;
    expect(await this.mock.$verifySolidity(this.messageHash, ...this.signature, ...reversedPublicKey)).to.be.false;
  });

  it('reject signature with flipped signature values ([r,s] >> [s,r])', async function () {
    const reversedSignature = Array.from(this.signature).reverse();
    expect(await this.mock.$verify(this.messageHash, ...reversedSignature, ...this.publicKey)).to.be.false;
    expect(await this.mock.$verifySolidity(this.messageHash, ...reversedSignature, ...this.publicKey)).to.be.false;
    expect(await this.mock.$recovery(this.messageHash, this.recovery, ...reversedSignature)).to.not.deep.equal(
      this.publicKey,
    );
    expect(await this.mock.$recoveryAddress(this.messageHash, this.recovery, ...reversedSignature)).to.not.equal(
      this.address,
    );
  });

  it('reject signature with invalid message hash', async function () {
    const invalidMessageHash = ethers.hexlify(ethers.randomBytes(32));
    expect(await this.mock.$verify(invalidMessageHash, ...this.signature, ...this.publicKey)).to.be.false;
    expect(await this.mock.$verifySolidity(invalidMessageHash, ...this.signature, ...this.publicKey)).to.be.false;
    expect(await this.mock.$recovery(invalidMessageHash, this.recovery, ...this.signature)).to.not.deep.equal(
      this.publicKey,
    );
    expect(await this.mock.$recoveryAddress(invalidMessageHash, this.recovery, ...this.signature)).to.not.equal(
      this.address,
    );
  });

  it('fail to recover signature with invalid recovery bit', async function () {
    const invalidRecovery = 1 - this.recovery;
    expect(await this.mock.$recovery(this.messageHash, invalidRecovery, ...this.signature)).to.not.deep.equal(
      this.publicKey,
    );
    expect(await this.mock.$recoveryAddress(this.messageHash, invalidRecovery, ...this.signature)).to.not.equal(
      this.address,
    );
  });
});
