const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const { shouldBehaveLikeERC721 } = require('./ERC721.behavior');
const { shouldSupportInterfaces } = require('../../introspection/SupportsInterface.behavior');

const ERC721FullMock = contract.fromArtifact('ERC721FullMock');

describe('ERC721Full', function () {
  const [ creator, ...otherAccounts ] = accounts;
  const minter = creator;

  const [
    owner,
    newOwner,
    other,
  ] = otherAccounts;

  const name = 'Non Fungible Token';
  const symbol = 'NFT';
  const firstTokenId = new BN(100);
  const secondTokenId = new BN(200);
  const thirdTokenId = new BN(300);
  const nonExistentTokenId = new BN(999);

  beforeEach(async function () {
    this.token = await ERC721FullMock.new(name, symbol, { from: creator });
  });

  describe('like a full ERC721', function () {
    beforeEach(async function () {
      await this.token.mint(owner, firstTokenId, { from: minter });
      await this.token.mint(owner, secondTokenId, { from: minter });
    });

    describe('mint', function () {
      beforeEach(async function () {
        await this.token.mint(newOwner, thirdTokenId, { from: minter });
      });

      it('adjusts owner tokens by index', async function () {
        expect(await this.token.tokenOfOwnerByIndex(newOwner, 0)).to.be.bignumber.equal(thirdTokenId);
      });

      it('adjusts all tokens list', async function () {
        expect(await this.token.tokenByIndex(2)).to.be.bignumber.equal(thirdTokenId);
      });
    });

    describe('burn', function () {
      beforeEach(async function () {
        await this.token.burn(firstTokenId, { from: owner });
      });

      it('removes that token from the token list of the owner', async function () {
        expect(await this.token.tokenOfOwnerByIndex(owner, 0)).to.be.bignumber.equal(secondTokenId);
      });

      it('adjusts all tokens list', async function () {
        expect(await this.token.tokenByIndex(0)).to.be.bignumber.equal(secondTokenId);
      });

      it('burns all tokens', async function () {
        await this.token.burn(secondTokenId, { from: owner });
        expect(await this.token.totalSupply()).to.be.bignumber.equal('0');
        await expectRevert(
          this.token.tokenByIndex(0), 'ERC721Enumerable: global index out of bounds'
        );
      });
    });

    describe('metadata', function () {
      it('has a name', async function () {
        expect(await this.token.name()).to.be.equal(name);
      });

      it('has a symbol', async function () {
        expect(await this.token.symbol()).to.be.equal(symbol);
      });

      describe('token URI', function () {
        const baseURI = 'https://api.com/v1/';
        const sampleUri = 'mock://mytoken';

        it('it is empty by default', async function () {
          expect(await this.token.tokenURI(firstTokenId)).to.be.equal('');
        });

        it('reverts when queried for non existent token id', async function () {
          await expectRevert(
            this.token.tokenURI(nonExistentTokenId), 'ERC721Metadata: URI query for nonexistent token'
          );
        });

        it('can be set for a token id', async function () {
          await this.token.setTokenURI(firstTokenId, sampleUri);
          expect(await this.token.tokenURI(firstTokenId)).to.be.equal(sampleUri);
        });

        it('reverts when setting for non existent token id', async function () {
          await expectRevert(
            this.token.setTokenURI(nonExistentTokenId, sampleUri), 'ERC721Metadata: URI set of nonexistent token'
          );
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

          const newBaseURI = 'https://api.com/v2/';
          await this.token.setBaseURI(newBaseURI);
          expect(await this.token.tokenURI(firstTokenId)).to.be.equal(newBaseURI + sampleUri);
        });

        it('token URI is empty for tokens with no URI but with base URI', async function () {
          await this.token.setBaseURI(baseURI);

          expect(await this.token.tokenURI(firstTokenId)).to.be.equal('');
        });

        it('tokens with URI can be burnt ', async function () {
          await this.token.setTokenURI(firstTokenId, sampleUri);

          await this.token.burn(firstTokenId, { from: owner });

          expect(await this.token.exists(firstTokenId)).to.equal(false);
          await expectRevert(
            this.token.tokenURI(firstTokenId), 'ERC721Metadata: URI query for nonexistent token'
          );
        });
      });
    });

    describe('tokensOfOwner', function () {
      it('returns total tokens of owner', async function () {
        const tokenIds = await this.token.tokensOfOwner(owner);
        expect(tokenIds.length).to.equal(2);
        expect(tokenIds[0]).to.be.bignumber.equal(firstTokenId);
        expect(tokenIds[1]).to.be.bignumber.equal(secondTokenId);
      });
    });

    describe('totalSupply', function () {
      it('returns total token supply', async function () {
        expect(await this.token.totalSupply()).to.be.bignumber.equal('2');
      });
    });

    describe('tokenOfOwnerByIndex', function () {
      describe('when the given index is lower than the amount of tokens owned by the given address', function () {
        it('returns the token ID placed at the given index', async function () {
          expect(await this.token.tokenOfOwnerByIndex(owner, 0)).to.be.bignumber.equal(firstTokenId);
        });
      });

      describe('when the index is greater than or equal to the total tokens owned by the given address', function () {
        it('reverts', async function () {
          await expectRevert(
            this.token.tokenOfOwnerByIndex(owner, 2), 'ERC721Enumerable: owner index out of bounds'
          );
        });
      });

      describe('when the given address does not own any token', function () {
        it('reverts', async function () {
          await expectRevert(
            this.token.tokenOfOwnerByIndex(other, 0), 'ERC721Enumerable: owner index out of bounds'
          );
        });
      });

      describe('after transferring all tokens to another user', function () {
        beforeEach(async function () {
          await this.token.transferFrom(owner, other, firstTokenId, { from: owner });
          await this.token.transferFrom(owner, other, secondTokenId, { from: owner });
        });

        it('returns correct token IDs for target', async function () {
          expect(await this.token.balanceOf(other)).to.be.bignumber.equal('2');
          const tokensListed = await Promise.all(
            [0, 1].map(i => this.token.tokenOfOwnerByIndex(other, i))
          );
          expect(tokensListed.map(t => t.toNumber())).to.have.members([firstTokenId.toNumber(),
            secondTokenId.toNumber()]);
        });

        it('returns empty collection for original owner', async function () {
          expect(await this.token.balanceOf(owner)).to.be.bignumber.equal('0');
          await expectRevert(
            this.token.tokenOfOwnerByIndex(owner, 0), 'ERC721Enumerable: owner index out of bounds'
          );
        });
      });
    });

    describe('tokenByIndex', function () {
      it('should return all tokens', async function () {
        const tokensListed = await Promise.all(
          [0, 1].map(i => this.token.tokenByIndex(i))
        );
        expect(tokensListed.map(t => t.toNumber())).to.have.members([firstTokenId.toNumber(),
          secondTokenId.toNumber()]);
      });

      it('should revert if index is greater than supply', async function () {
        await expectRevert(
          this.token.tokenByIndex(2), 'ERC721Enumerable: global index out of bounds'
        );
      });

      [firstTokenId, secondTokenId].forEach(function (tokenId) {
        it(`should return all tokens after burning token ${tokenId} and minting new tokens`, async function () {
          const newTokenId = new BN(300);
          const anotherNewTokenId = new BN(400);

          await this.token.burn(tokenId, { from: owner });
          await this.token.mint(newOwner, newTokenId, { from: minter });
          await this.token.mint(newOwner, anotherNewTokenId, { from: minter });

          expect(await this.token.totalSupply()).to.be.bignumber.equal('3');

          const tokensListed = await Promise.all(
            [0, 1, 2].map(i => this.token.tokenByIndex(i))
          );
          const expectedTokens = [firstTokenId, secondTokenId, newTokenId, anotherNewTokenId].filter(
            x => (x !== tokenId)
          );
          expect(tokensListed.map(t => t.toNumber())).to.have.members(expectedTokens.map(t => t.toNumber()));
        });
      });
    });
  });

  shouldBehaveLikeERC721(creator, minter, otherAccounts);

  shouldSupportInterfaces([
    'ERC165',
    'ERC721',
    'ERC721Enumerable',
    'ERC721Metadata',
  ]);
});
