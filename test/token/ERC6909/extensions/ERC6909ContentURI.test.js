const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const token = await ethers.deployContract('$ERC6909ContentURI');
  return { token };
}

describe('ERC6909ContentURI', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('contractURI', function () {
    it('is empty string by default', async function () {
      await expect(this.token.contractURI()).to.eventually.equal('');
    });

    it('is settable by internal setter', async function () {
      await this.token.$_setContractURI('https://example.com');
      await expect(this.token.contractURI()).to.eventually.equal('https://example.com');
    });

    it('emits an event when set', async function () {
      await expect(this.token.$_setContractURI('https://example.com')).to.emit(this.token, 'ContractURIUpdated');
    });
  });

  describe('tokenURI', function () {
    it('is empty string by default', async function () {
      await expect(this.token.tokenURI(1n)).to.eventually.equal('');
    });

    it('can be set by dedicated setter', async function () {
      await this.token.$_setTokenURI(1n, 'https://example.com/1');
      await expect(this.token.tokenURI(1n)).to.eventually.equal('https://example.com/1');

      // Only set for the specified token ID
      await expect(this.token.tokenURI(2n)).to.eventually.equal('');
    });

    it('emits an event when set', async function () {
      await expect(this.token.$_setTokenURI(1n, 'https://example.com/1'))
        .to.emit(this.token, 'URI')
        .withArgs('https://example.com/1', 1n);
    });
  });
});
