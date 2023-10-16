const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture, mine } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const signers = await ethers.getSigners();
  const addresses = await Promise.all(signers.map(s => s.getAddress()));
  return { signers, addresses }
}

contract('Environment sanity', function (accounts) {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('signers', function () {
    it('match accounts', async function () {
      expect(this.addresses).to.deep.equal(accounts);
    });

    it('signer #0 is skipped', async function () {
      const signer = await ethers.provider.getSigner(0);
      expect(this.addresses).to.not.include(await signer.getAddress());
    });
  });

  describe('snapshot', function () {
    it('cache and mine', async function () {
      this.cache = await ethers.provider.getBlockNumber();
      await mine();
      expect(await ethers.provider.getBlockNumber()).to.be.equal(this.cache + 1);
    });

    it('check snapshot', async function () {
      expect(await ethers.provider.getBlockNumber()).to.be.equal(this.cache);
    });
  });
});
