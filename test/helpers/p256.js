const { ethers } = require('hardhat');
const { secp256r1 } = require('@noble/curves/p256');

class P256Signer {
  constructor(privateKey) {
    this.privateKey = privateKey;
    this.publicKey = ethers.concat(
      [
        secp256r1.getPublicKey(this.privateKey, false).slice(0x01, 0x21),
        secp256r1.getPublicKey(this.privateKey, false).slice(0x21, 0x41),
      ].map(ethers.hexlify),
    );
    this.address = ethers.getAddress(ethers.keccak256(this.publicKey).slice(-40));
  }

  static random() {
    return new P256Signer(secp256r1.utils.randomPrivateKey());
  }

  getAddress() {
    return this.address;
  }

  signMessage(message) {
    const { r, s, recovery } = secp256r1.sign(ethers.hashMessage(message).replace(/0x/, ''), this.privateKey);
    return ethers.solidityPacked(['uint256', 'uint256', 'uint8'], [r, s, recovery]);
  }
}

module.exports = {
  P256Signer,
};
