const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const token = await ethers.deployContract('$ERC6909Metadata');
  return { token };
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
  });
});
