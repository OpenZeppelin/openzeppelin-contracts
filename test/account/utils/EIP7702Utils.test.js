const { ethers, config } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

// [NOTE]
//
// ethers.getSigners() returns object than cannot currently send type-4 transaction, or sign authorization. Therefore,
// we have to instantiate the eoa AND the relayer manually using ethers 6.14.0 wallets. This can be improved when
// @nomicfoundation/hardhat-ethers starts instantiating signers with 7702 support.
const relayAuthorization = authorization =>
  ethers.Wallet.fromPhrase(config.networks.hardhat.accounts.mnemonic, ethers.provider).sendTransaction({
    to: ethers.ZeroAddress,
    authorizationList: [authorization],
    gasLimit: 46_000n,
  });

const fixture = async () => {
  const eoa = ethers.Wallet.createRandom(ethers.provider);
  const mock = await ethers.deployContract('$EIP7702Utils');
  return { eoa, mock };
};

describe('EIP7702Utils', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('fetchDelegate', function () {
    it('EOA without delegation', async function () {
      await expect(this.mock.$fetchDelegate(this.eoa)).to.eventually.equal(ethers.ZeroAddress);
    });

    it('EOA with delegation', async function () {
      // set delegation
      await this.eoa.authorize({ address: this.mock }).then(relayAuthorization);

      await expect(this.mock.$fetchDelegate(this.eoa)).to.eventually.equal(this.mock);
    });

    it('EOA with revoked delegation', async function () {
      // set delegation
      await this.eoa.authorize({ address: this.mock }).then(relayAuthorization);
      // reset delegation
      await this.eoa.authorize({ address: ethers.ZeroAddress }).then(relayAuthorization);

      await expect(this.mock.$fetchDelegate(this.eoa)).to.eventually.equal(ethers.ZeroAddress);
    });

    it('other smart contract', async function () {
      await expect(this.mock.$fetchDelegate(this.mock)).to.eventually.equal(ethers.ZeroAddress);
    });
  });
});
