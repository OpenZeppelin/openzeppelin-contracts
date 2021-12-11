const { BN, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ERC721EnumerableStoredTokenMock = artifacts.require('ERC721EnumerableStoredTokenMock');

contract('ERC721EnumerableStoredToken', function (accounts) {
  const [ owner ] = accounts;

  const name = 'Non Fungible Token';
  const symbol = 'NFT';

  const firstTokenId = new BN('5042');
  const nonExistentTokenId = new BN('13');

  beforeEach(async function () {
    this.token = await ERC721EnumerableStoredTokenMock.new(name, symbol);
  });

  describe('token URI', function () {
    beforeEach(async function () {
      await this.token.mint(owner, firstTokenId);
    });

    const baseURI = 'https://api.example.com/v1/';
    const sampleUri = 'mock://mytoken';

    it('it is empty by default', async function () {
      expect(await this.token.tokenURI(firstTokenId)).to.be.equal('');
    });

    it('totalSupply is 1 when minted', async function () {
      const actualSupply = await this.token.totalSupply();
      expect(actualSupply).to.be.bignumber.equal('1');
    });

    it('totalSupply is 2 when minted twice', async function () {
      const secondTokenId = new BN('5043');
      await this.token.mint(owner, secondTokenId);
      const actualSupply = await this.token.totalSupply();
      expect(actualSupply).to.be.bignumber.equal('2');
    });

    it('reverts when queried for non existent token id', async function () {
      await expectRevert(
        this.token.tokenURI(nonExistentTokenId), 'ERC721EnumerableStoredToken: URI query for nonexistent token',
      );
    });

    it('can be set for a token id', async function () {
      await this.token.setTokenURI(firstTokenId, sampleUri);
      expect(await this.token.tokenURI(firstTokenId)).to.be.equal(sampleUri);
    });

    it('reverts when setting for non existent token id', async function () {
      await expectRevert(
        this.token.setTokenURI(nonExistentTokenId, sampleUri),
        'ERC721EnumerableStoredToken: URI set of nonexistent token');
    });

    it('base URI can be set', async function () {
      await this.token.setBaseURI(baseURI);
      expect(await this.token.baseURI()).to.equal(baseURI);
    });

    it('base URI is added as a prefix to the token URI', async function () {
      await this.token.setBaseURI(baseURI);
      await this.token.setTokenURI(firstTokenId, sampleUri);

      expect(await this.token.tokenURI(firstTokenId)).to.be.equal(baseURI + sampleUri);
    });

    it('token URI can be changed by changing the base URI', async function () {
      await this.token.setBaseURI(baseURI);
      await this.token.setTokenURI(firstTokenId, sampleUri);

      const newBaseURI = 'https://api.example.com/v2/';
      await this.token.setBaseURI(newBaseURI);
      expect(await this.token.tokenURI(firstTokenId)).to.be.equal(newBaseURI + sampleUri);
    });

    it('tokenId is appended to base URI for tokens with no URI', async function () {
      await this.token.setBaseURI(baseURI);

      expect(await this.token.tokenURI(firstTokenId)).to.be.equal(baseURI + firstTokenId);
    });

    it('tokens without URI can be burnt ', async function () {
      await this.token.burn(firstTokenId, { from: owner });

      expect(await this.token.exists(firstTokenId)).to.equal(false);
      await expectRevert(
        this.token.tokenURI(firstTokenId), 'ERC721EnumerableStoredToken: URI query for nonexistent token',
      );
    });

    it('tokens with URI can be burnt ', async function () {
      await this.token.setTokenURI(firstTokenId, sampleUri);

      await this.token.burn(firstTokenId, { from: owner });

      expect(await this.token.exists(firstTokenId)).to.equal(false);
      await expectRevert(
        this.token.tokenURI(firstTokenId), 'ERC721EnumerableStoredToken: URI query for nonexistent token',
      );
    });

    it('totalSupply is 0 when token is burnt ', async function () {
      await this.token.burn(firstTokenId, { from: owner });

      const actualSupply = await this.token.totalSupply();
      expect(actualSupply).to.be.bignumber.equal('0');
    });

    it('totalSupply is reduced by 1 when one token is burnt ', async function () {
      const secondTokenId = new BN('5043');
      await this.token.mint(owner, secondTokenId);

      await this.token.burn(firstTokenId, { from: owner });

      const actualSupply = await this.token.totalSupply();
      expect(actualSupply).to.be.bignumber.equal('1');
    });
  });
});
