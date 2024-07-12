const { ethers } = require('hardhat');
const { secp256r1 } = require('@noble/curves/p256');

const { SignatureType } = require('./enums');

class P256Signer {
  constructor(privateKey, params = {}) {
    this.privateKey = privateKey;
    this.publicKey = ethers.concat(
      [
        secp256r1.getPublicKey(this.privateKey, false).slice(0x01, 0x21),
        secp256r1.getPublicKey(this.privateKey, false).slice(0x21, 0x41),
      ].map(ethers.hexlify),
    );
    this.address = ethers.getAddress(ethers.keccak256(this.publicKey).slice(-40));
    this.params = Object.assign({ withPrefixAddress: false, withRecovery: true }, params);
  }

  get type() {
    return SignatureType.ERC1271;
  }

  static random(params = {}) {
    return new P256Signer(secp256r1.utils.randomPrivateKey(), params);
  }

  getAddress() {
    return this.address;
  }

  signMessage(message) {
    let { r, s, recovery } = secp256r1.sign(ethers.hashMessage(message).replace(/0x/, ''), this.privateKey);

    // ensureLowerOrderS
    if (s > secp256r1.CURVE.n / 2n) {
      s = secp256r1.CURVE.n - s;
      recovery = 1 - recovery;
    }

    // pack signature
    const elements = [
      this.params.withPrefixAddress && { type: 'address', value: this.address },
      { type: 'uint256', value: ethers.toBeHex(r) },
      { type: 'uint256', value: ethers.toBeHex(s) },
      this.params.withRecovery && { type: 'uint8', value: recovery },
    ].filter(Boolean);

    return ethers.solidityPacked(
      elements.map(({ type }) => type),
      elements.map(({ value }) => value),
    );
  }
}

module.exports = {
  P256Signer,
};
