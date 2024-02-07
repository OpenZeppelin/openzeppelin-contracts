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
  const { r, s, recovery } = secp256r1.sign(messageHash.replace(/0x/, ''), privateKey);
  const signature = [ r, s ].map(v => ethers.toBeHex(v, 0x20));
  return { privateKey, publicKey, signature, recovery, messageHash };
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

  Array(10).fill().forEach((_, i, {length}) => {
    it(`confirm valid signature (run ${i + 1}/${length})`, async function () {
      expect(await this.mock.$verify(...this.publicKey, ...this.signature, this.messageHash)).to.be.true;
    });

    it(`recover public key (run ${i + 1}/${length})`, async function () {
      expect(await this.mock.$recovery(...this.signature, this.recovery, this.messageHash)).to.deep.equal(this.publicKey);
    });
  });

  it('reject signature with flipped public key coordinates ([x,y] >> [y,x])', async function () {
    this.publicKey.reverse();
    expect(await this.mock.$verify(...this.publicKey, ...this.signature, this.messageHash)).to.be.false;
  });

  it('reject signature with flipped signature values ([r,s] >> [s,r])', async function () {
    this.signature.reverse();
    expect(await this.mock.$verify(...this.publicKey, ...this.signature, this.messageHash)).to.be.false;
  });

  it('reject signature with invalid message hash', async function () {
    var invalidMessageHash = ethers.hexlify(ethers.randomBytes(32));
    expect(await this.mock.$verify(...this.publicKey, ...this.signature, invalidMessageHash)).to.be.false;
  });
});