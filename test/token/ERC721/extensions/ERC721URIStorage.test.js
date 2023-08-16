const { BN, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const { shouldSupportInterfaces } = require('../../../utils/introspection/SupportsInterface.behavior');
const { expectRevertCustomError } = require('../../../helpers/customError');

const ERC721URIStorageMock = artifacts.require('$ERC721URIStorageMock');

contract('ERC721URIStorage', function (accounts) {
  const [owner] = accounts;

  const name = 'Non Fungible Token';
  const symbol = 'NFT';

  const firstTokenId = new BN('5042');
  const nonExistentTokenId = new BN('13');

  beforeEach(async function () {
    this.token = await ERC721URIStorageMock.new(name, symbol);
  });

  shouldSupportInterfaces(['0x49064906']);

  describe('token URI', function () {
    beforeEach(async function () {
      await this.token.$_mint(owner, firstTokenId);
    });

    const baseURI = 'https://api.example.com/v1/';
    const sampleUri = 'mock://mytoken';

    it('it is empty by default', async function () {
      expect(await this.token.tokenURI(firstTokenId)).to.be.equal('');
    });

    it('reverts when queried for non existent token id', async function () {
      await expectRevertCustomError(this.token.tokenURI(nonExistentTokenId), 'ERC721NonexistentToken', [
        nonExistentTokenId,
      ]);
    });

    it('can be set for a token id', async function () {
      await this.token.$_setTokenURI(firstTokenId, sampleUri);
      expect(await this.token.tokenURI(firstTokenId)).to.be.equal(sampleUri);
    });

    it('setting the uri emits an event', async function () {
      expectEvent(await this.token.$_setTokenURI(firstTokenId, sampleUri), 'MetadataUpdate', {
        _tokenId: firstTokenId,
      });
    });

    it('reverts when setting for non existent token id', async function () {
      await expectRevertCustomError(this.token.$_setTokenURI(nonExistentTokenId, sampleUri), 'ERC721NonexistentToken', [
        nonExistentTokenId,
      ]);
    });

    it('base URI can be set', async function () {
      await this.token.setBaseURI(baseURI);
      expect(await this.token.$_baseURI()).to.equal(baseURI);
    });

    it('base URI is added as a prefix to the token URI', async function () {
      await this.token.setBaseURI(baseURI);
      await this.token.$_setTokenURI(firstTokenId, sampleUri);

      expect(await this.token.tokenURI(firstTokenId)).to.be.equal(baseURI + sampleUri);
    });

    it('token URI can be changed by changing the base URI', async function () {
      await this.token.setBaseURI(baseURI);
      await this.token.$_setTokenURI(firstTokenId, sampleUri);

      const newBaseURI = 'https://api.example.com/v2/';
      await this.token.setBaseURI(newBaseURI);
      expect(await this.token.tokenURI(firstTokenId)).to.be.equal(newBaseURI + sampleUri);
    });

    it('tokenId is appended to base URI for tokens with no URI', async function () {
      await this.token.setBaseURI(baseURI);

      expect(await this.token.tokenURI(firstTokenId)).to.be.equal(baseURI + firstTokenId);
    });

    it('tokens without URI can be burnt ', async function () {
      await this.token.$_burn(firstTokenId, { from: owner });

      await expectRevertCustomError(this.token.tokenURI(firstTokenId), 'ERC721NonexistentToken', [firstTokenId]);
    });

    it('tokens with URI can be burnt ', async function () {
      await this.token.$_setTokenURI(firstTokenId, sampleUri);

      await this.token.$_burn(firstTokenId, { from: owner });

      await expectRevertCustomError(this.token.tokenURI(firstTokenId), 'ERC721NonexistentToken', [firstTokenId]);
    });
  });
});
