const { ethers } = require('hardhat');

const { P256Signer } = require('./p256');
const { ModuleType } = require('./enums');

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

  async newECDSASigner(params = {}) {
    return Object.assign(ethers.Wallet.createRandom(params.provider), { type: ModuleType.Signer });
  }

  async newP256Signer(params = {}) {
    params.withPrefixAddress ??= true;

    await this.wait();
    const signer = P256Signer.random(params);
    await Promise.all([this.p256Factory.predict(signer.publicKey), this.p256Factory.create(signer.publicKey)]).then(
      ([address]) => Object.assign(signer, { address, provider: params.provider }),
    );

    return signer;
  }

  async newRSASigner() {
    await this.wait();

    return Promise.reject('Not implemented yet');
  }
}

module.exports = {
  IdentityHelper,
};
