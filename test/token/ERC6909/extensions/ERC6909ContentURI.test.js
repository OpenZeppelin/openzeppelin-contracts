const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');

async function fixture() {
  const [operator, holder, ...otherAccounts] = await ethers.getSigners();
  const token = await ethers.deployContract('$ERC6909ContentURI');
  return { token, operator, holder, otherAccounts };
}

describe('ERC6909ContentURI', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('contractURI', function () {
    it('is empty string be default', async function () {
      return expect(this.token.contractURI()).to.eventually.equal('');
    });

    it('is settable by internal setter', async function () {
      await this.token.$_setContractURI('https://example.com');
      return expect(this.token.contractURI()).to.eventually.equal('https://example.com');
    });
  });

  describe('tokenURI', function () {
    it('is empty string be default', async function () {
      return expect(this.token.tokenURI(1n)).to.eventually.equal('');
    });

    it('can be set by dedicated setter', async function () {
      await this.token.$_setTokenURI(1n, 'https://example.com/1');
      await expect(this.token.tokenURI(1n)).to.eventually.equal('https://example.com/1');

      // Only set for the specified token ID
      return expect(this.token.tokenURI(2n)).to.eventually.equal('');
    });
  });
});
