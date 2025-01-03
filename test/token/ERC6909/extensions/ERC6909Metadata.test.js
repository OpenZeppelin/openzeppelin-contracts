const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');

async function fixture() {
  const [operator, holder, ...otherAccounts] = await ethers.getSigners();
  const token = await ethers.deployContract('$ERC6909Metadata');
  return { token, operator, holder, otherAccounts };
}

describe('ERC6909Metadata', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('name', function () {
    it('is empty string be default', async function () {
      return expect(this.token.name(1n)).to.eventually.equal('');
    });

    it('can be set by dedicated setter', async function () {
      await this.token.$_setName(1n, 'My Token');
      await expect(this.token.name(1n)).to.eventually.equal('My Token');

      // Only set for the specified token ID
      return expect(this.token.name(2n)).to.eventually.equal('');
    });

    it('can be set by global setter', async function () {
      await this.token.$_setTokenMetadata(1n, { name: 'My Token', symbol: '', decimals: '0' });
      return expect(this.token.name(1n)).to.eventually.equal('My Token');
    });
  });

  describe('symbol', function () {
    it('is empty string be default', async function () {
      return expect(this.token.symbol(1n)).to.eventually.equal('');
    });

    it('can be set by dedicated setter', async function () {
      await this.token.$_setSymbol(1n, 'MTK');
      await expect(this.token.symbol(1n)).to.eventually.equal('MTK');

      // Only set for the specified token ID
      return expect(this.token.symbol(2n)).to.eventually.equal('');
    });

    it('can be set by global setter', async function () {
      await this.token.$_setTokenMetadata(1n, { name: '', symbol: 'MTK', decimals: '0' });
      return expect(this.token.symbol(1n)).to.eventually.equal('MTK');
    });
  });

  describe('decimals', function () {
    it('is 0 by default', async function () {
      return expect(this.token.decimals(1n)).to.eventually.equal(0);
    });

    it('can be set by dedicated setter', async function () {
      await this.token.$_setDecimals(1n, 18);
      await expect(this.token.decimals(1n)).to.eventually.equal(18);

      // Only set for the specified token ID
      return expect(this.token.decimals(2n)).to.eventually.equal(0);
    });

    it('can be set by global setter', async function () {
      await this.token.$_setTokenMetadata(1n, { name: '', symbol: '', decimals: '18' });
      return expect(this.token.decimals(1n)).to.eventually.equal(18);
    });
  });
});
