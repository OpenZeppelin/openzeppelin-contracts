const { ethers } = require('hardhat');

const { Enum } = require('./enums');
const { P256Signer } = require('./p256');

const SignatureType = Enum('ECDSA', 'ERC1271');

class IdentityHelper {
  constructor() {
    this.p256FactoryAsPromise = ethers.deployContract('IdentityP256Factory');
    this.rsaFactoryAsPromise = ethers.deployContract('IdentityRSAFactory');
  }

  async wait() {
    this.p256Factory = await this.p256FactoryAsPromise;
    this.rsaFactory = await this.rsaFactoryAsPromise;
    return this;
  }

  async newECDSASigner() {
    return Object.assign(ethers.Wallet.createRandom(), { type: SignatureType.ECDSA });
  }

  async newP256Signer(sigParams = { prefixAddress: true }) {
    await this.wait();

    const signer = P256Signer.random();
    return Promise.all([this.p256Factory.predict(signer.publicKey), this.p256Factory.create(signer.publicKey)]).then(
      ([address]) => Object.assign(signer, { address, sigParams, type: SignatureType.ERC1271 }),
    );
  }

  async newRSASigner() {
    await this.wait();

    return Promise.reject('Not implemented yet');
  }
}

module.exports = {
  SignatureType,
  IdentityHelper,
};
