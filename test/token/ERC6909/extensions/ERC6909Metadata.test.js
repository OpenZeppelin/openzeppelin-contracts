const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldSupportInterfaces } = require('../../../utils/introspection/SupportsInterface.behavior');

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
      await expect(this.token.name(1n)).to.eventually.equal('');
    });

    it('can be set by dedicated setter', async function () {
      await expect(this.token.$_setName(1n, 'My Token'))
        .to.emit(this.token, 'ERC6909NameUpdated')
        .withArgs(1n, 'My Token');
      await expect(this.token.name(1n)).to.eventually.equal('My Token');

      // Only set for the specified token ID
      await expect(this.token.name(2n)).to.eventually.equal('');
    });
  });

  describe('symbol', function () {
    it('is empty string be default', async function () {
      await expect(this.token.symbol(1n)).to.eventually.equal('');
    });

    it('can be set by dedicated setter', async function () {
      await expect(this.token.$_setSymbol(1n, 'MTK')).to.emit(this.token, 'ERC6909SymbolUpdated').withArgs(1n, 'MTK');
      await expect(this.token.symbol(1n)).to.eventually.equal('MTK');

      // Only set for the specified token ID
      await expect(this.token.symbol(2n)).to.eventually.equal('');
    });
  });

  describe('decimals', function () {
    it('is 0 by default', async function () {
      await expect(this.token.decimals(1n)).to.eventually.equal(0);
    });

    it('can be set by dedicated setter', async function () {
      await expect(this.token.$_setDecimals(1n, 18)).to.emit(this.token, 'ERC6909DecimalsUpdated').withArgs(1n, 18);
      await expect(this.token.decimals(1n)).to.eventually.equal(18);

      // Only set for the specified token ID
      await expect(this.token.decimals(2n)).to.eventually.equal(0);
    });
  });

  shouldSupportInterfaces(['ERC6909', 'ERC6909Metadata']);
});
