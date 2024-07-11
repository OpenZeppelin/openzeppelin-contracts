const { ethers } = require('hardhat');
const { secp256r1 } = require('@noble/curves/p256');

const N = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;

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
    this.sigParams = { prefixAddress: false, includeRecovery: true };
  }

  static random() {
    return new P256Signer(secp256r1.utils.randomPrivateKey());
  }

  getAddress() {
    return this.address;
  }

  signMessage(message) {
    let { r, s, recovery } = secp256r1.sign(ethers.hashMessage(message).replace(/0x/, ''), this.privateKey);

    // ensureLowerOrderS
    if (s > N / 2n) {
      s = N - s;
      recovery = 1 - recovery;
    }

    // pack signature
    const signature = this.sigParams.includeRecovery
      ? ethers.solidityPacked(['uint256', 'uint256', 'uint8'], [r, s, recovery])
      : ethers.solidityPacked(['uint256', 'uint256'], [r, s]);
    return this.sigParams.prefixAddress
      ? ethers.AbiCoder.defaultAbiCoder().encode(['address', 'bytes'], [this.address, signature])
      : signature;
  }
}

module.exports = {
  P256Signer,
};
