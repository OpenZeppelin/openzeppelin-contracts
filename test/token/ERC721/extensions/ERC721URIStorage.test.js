const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldSupportInterfaces } = require('../../../utils/introspection/SupportsInterface.behavior');

const name = 'Non Fungible Token';
const symbol = 'NFT';
const baseURI = 'https://api.example.com/v1/';
const otherBaseURI = 'https://api.example.com/v2/';
const sampleUri = 'mock://mytoken';
const tokenId = 1n;
const nonExistentTokenId = 2n;

async function fixture() {
  const [owner] = await ethers.getSigners();
  const token = await ethers.deployContract('$ERC721URIStorageMock', [name, symbol]);
  return { owner, token };
}

contract('ERC721URIStorage', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldSupportInterfaces(['0x49064906']);

  describe('token URI', function () {
    beforeEach(async function () {
      await this.token.$_mint(this.owner, tokenId);
    });

    it('it is empty by default', async function () {
      expect(await this.token.tokenURI(tokenId)).to.equal('');
    });

    it('reverts when queried for non existent token id', async function () {
      await expect(this.token.tokenURI(nonExistentTokenId))
        .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
        .withArgs(nonExistentTokenId);
    });

    it('can be set for a token id', async function () {
      await this.token.$_setTokenURI(tokenId, sampleUri);
      expect(await this.token.tokenURI(tokenId)).to.equal(sampleUri);
    });

    it('setting the uri emits an event', async function () {
      await expect(this.token.$_setTokenURI(tokenId, sampleUri))
        .to.emit(this.token, 'MetadataUpdate')
        .withArgs(tokenId);
    });

    it('setting the uri for non existent token id is allowed', async function () {
      await expect(await this.token.$_setTokenURI(nonExistentTokenId, sampleUri))
        .to.emit(this.token, 'MetadataUpdate')
        .withArgs(nonExistentTokenId);

      // value will be accessible after mint
      await this.token.$_mint(this.owner, nonExistentTokenId);
      expect(await this.token.tokenURI(nonExistentTokenId)).to.equal(sampleUri);
    });

    it('base URI can be set', async function () {
      await this.token.setBaseURI(baseURI);
      expect(await this.token.$_baseURI()).to.equal(baseURI);
    });

    it('base URI is added as a prefix to the token URI', async function () {
      await this.token.setBaseURI(baseURI);
      await this.token.$_setTokenURI(tokenId, sampleUri);

      expect(await this.token.tokenURI(tokenId)).to.equal(baseURI + sampleUri);
    });

    it('token URI can be changed by changing the base URI', async function () {
      await this.token.setBaseURI(baseURI);
      await this.token.$_setTokenURI(tokenId, sampleUri);

      await this.token.setBaseURI(otherBaseURI);
      expect(await this.token.tokenURI(tokenId)).to.equal(otherBaseURI + sampleUri);
    });

    it('tokenId is appended to base URI for tokens with no URI', async function () {
      await this.token.setBaseURI(baseURI);

      expect(await this.token.tokenURI(tokenId)).to.equal(baseURI + tokenId);
    });

    it('tokens without URI can be burnt ', async function () {
      await this.token.$_burn(tokenId);

      await expect(this.token.tokenURI(tokenId))
        .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
        .withArgs(tokenId);
    });

    it('tokens with URI can be burnt ', async function () {
      await this.token.$_setTokenURI(tokenId, sampleUri);

      await this.token.$_burn(tokenId);

      await expect(this.token.tokenURI(tokenId))
        .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
        .withArgs(tokenId);
    });

    it('tokens URI is kept if token is burnt and reminted ', async function () {
      await this.token.$_setTokenURI(tokenId, sampleUri);

      await this.token.$_burn(tokenId);

      await expect(this.token.tokenURI(tokenId))
        .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
        .withArgs(tokenId);

      await this.token.$_mint(this.owner, tokenId);
      expect(await this.token.tokenURI(tokenId)).to.equal(sampleUri);
    });
  });
});
