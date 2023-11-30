const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const erc1155Uri = 'https://token.com/nfts/';
const baseUri = 'https://token.com/';
const tokenId = 1n;
const value = 3000n;

describe('ERC1155URIStorage', function () {
  describe('with base uri set', function () {
    async function fixture() {
      const [holder] = await ethers.getSigners();

      const token = await ethers.deployContract('$ERC1155URIStorage', [erc1155Uri]);
      await token.$_setBaseURI(baseUri);
      await token.$_mint(holder, tokenId, value, '0x');

      return { token, holder };
    }

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    it('can request the token uri, returning the erc1155 uri if no token uri was set', async function () {
      expect(await this.token.uri(tokenId)).to.equal(erc1155Uri);
    });

    it('can request the token uri, returning the concatenated uri if a token uri was set', async function () {
      const tokenUri = '1234/';
      const expectedUri = `${baseUri}${tokenUri}`;

      await expect(this.token.$_setURI(ethers.Typed.uint256(tokenId), tokenUri))
        .to.emit(this.token, 'URI')
        .withArgs(expectedUri, tokenId);

      expect(await this.token.uri(tokenId)).to.equal(expectedUri);
    });
  });

  describe('with base uri set to the empty string', function () {
    async function fixture() {
      const [holder] = await ethers.getSigners();

      const token = await ethers.deployContract('$ERC1155URIStorage', ['']);
      await token.$_mint(holder, tokenId, value, '0x');

      return { token, holder };
    }

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    it('can request the token uri, returning an empty string if no token uri was set', async function () {
      expect(await this.token.uri(tokenId)).to.equal('');
    });

    it('can request the token uri, returning the token uri if a token uri was set', async function () {
      const tokenUri = 'ipfs://1234/';

      await expect(this.token.$_setURI(ethers.Typed.uint256(tokenId), tokenUri))
        .to.emit(this.token, 'URI')
        .withArgs(tokenUri, tokenId);

      expect(await this.token.uri(tokenId)).to.equal(tokenUri);
    });
  });
});
