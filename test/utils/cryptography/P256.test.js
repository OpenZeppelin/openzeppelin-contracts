const { ethers } = require('hardhat');
const { expect } = require('chai');
const { secp256r1 } = require('@noble/curves/p256');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const prepareSignature = (
  privateKey = secp256r1.utils.randomPrivateKey(),
  messageHash = ethers.hexlify(ethers.randomBytes(0x20))
) => {
  const publicKey = [
    secp256r1.getPublicKey(privateKey, false).slice(0x01, 0x21),
    secp256r1.getPublicKey(privateKey, false).slice(0x21, 0x41),
  ].map(ethers.hexlify)
  const address = ethers.getAddress(ethers.keccak256(ethers.concat(publicKey)).slice(-40));
  const { r, s, recovery } = secp256r1.sign(messageHash.replace(/0x/, ''), privateKey);
  const signature = [ r, s ].map(v => ethers.toBeHex(v, 0x20));
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
    expect(await this.mock.$verify(...this.publicKey, ...this.signature, this.messageHash)).to.be.true;
  });

  it('recover public key', async function () {
    expect(await this.mock.$recovery(...this.signature, this.recovery, this.messageHash)).to.deep.equal(this.publicKey);
  });

  it('recover address', async function () {
    expect(await this.mock.$recoveryAddress(...this.signature, this.recovery, this.messageHash)).to.equal(this.address);
  });

  it('reject signature with flipped public key coordinates ([x,y] >> [y,x])', async function () {
    const reversedPublicKey = Array.from(this.publicKey).reverse();
    expect(await this.mock.$verify(...reversedPublicKey, ...this.signature, this.messageHash)).to.be.false;
  });

  it('reject signature with flipped signature values ([r,s] >> [s,r])', async function () {
    const reversedSignature = Array.from(this.signature).reverse();
    expect(await this.mock.$verify(...this.publicKey, ...reversedSignature, this.messageHash)).to.be.false;
    expect(await this.mock.$recovery(...reversedSignature, this.recovery, this.messageHash)).to.not.deep.equal(this.publicKey);
    expect(await this.mock.$recoveryAddress(...reversedSignature, this.recovery, this.messageHash)).to.not.equal(this.address);
  });

  it('reject signature with invalid message hash', async function () {
    const invalidMessageHash = ethers.hexlify(ethers.randomBytes(32));
    expect(await this.mock.$verify(...this.publicKey, ...this.signature, invalidMessageHash)).to.be.false;
    expect(await this.mock.$recovery(...this.signature, this.recovery, invalidMessageHash)).to.not.deep.equal(this.publicKey);
    expect(await this.mock.$recoveryAddress(...this.signature, this.recovery, invalidMessageHash)).to.not.equal(this.address);
  });
});