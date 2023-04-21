const { BN, expectEvent } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');
const { artifacts } = require('hardhat');

const ERC1155URIStorage = artifacts.require('$ERC1155URIStorage');

contract(['ERC1155URIStorage'], function (accounts) {
  const [holder] = accounts;

  const erc1155Uri = 'https://token.com/nfts/';
  const baseUri = 'https://token.com/';

  const tokenId = new BN('1');
  const amount = new BN('3000');

  describe('with base uri set', function () {
    beforeEach(async function () {
      this.token = await ERC1155URIStorage.new(erc1155Uri);
      await this.token.$_setBaseURI(baseUri);

      await this.token.$_mint(holder, tokenId, amount, '0x');
    });

    it('can request the token uri, returning the erc1155 uri if no token uri was set', async function () {
      const receivedTokenUri = await this.token.uri(tokenId);

      expect(receivedTokenUri).to.be.equal(erc1155Uri);
    });

    it('can request the token uri, returning the concatenated uri if a token uri was set', async function () {
      const tokenUri = '1234/';
      const receipt = await this.token.$_setURI(tokenId, tokenUri);

      const receivedTokenUri = await this.token.uri(tokenId);

      const expectedUri = `${baseUri}${tokenUri}`;
      expect(receivedTokenUri).to.be.equal(expectedUri);
      expectEvent(receipt, 'URI', { value: expectedUri, id: tokenId });
    });
  });

  describe('with base uri set to the empty string', function () {
    beforeEach(async function () {
      this.token = await ERC1155URIStorage.new('');

      await this.token.$_mint(holder, tokenId, amount, '0x');
    });

    it('can request the token uri, returning an empty string if no token uri was set', async function () {
      const receivedTokenUri = await this.token.uri(tokenId);

      expect(receivedTokenUri).to.be.equal('');
    });

    it('can request the token uri, returning the token uri if a token uri was set', async function () {
      const tokenUri = 'ipfs://1234/';
      const receipt = await this.token.$_setURI(tokenId, tokenUri);

      const receivedTokenUri = await this.token.uri(tokenId);

      expect(receivedTokenUri).to.be.equal(tokenUri);
      expectEvent(receipt, 'URI', { value: tokenUri, id: tokenId });
    });
  });
});
