const { BN, shouldFail } = require('openzeppelin-test-helpers');

const { shouldBehaveLikeERC721 } = require('./ERC721.behavior');
const { shouldSupportInterfaces } = require('../../introspection/SupportsInterface.behavior');

const ERC721FullMock = artifacts.require('ERC721FullMock.sol');

contract('ERC721Full', function ([
  creator,
  ...accounts
]) {
  const name = 'Non Fungible Token';
  const symbol = 'NFT';
  const firstTokenId = new BN(100);
  const secondTokenId = new BN(200);
  const thirdTokenId = new BN(300);
  const nonExistentTokenId = new BN(999);

  const minter = creator;

  const [
    owner,
    newOwner,
    another,
  ] = accounts;

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
        (await this.token.tokenOfOwnerByIndex(newOwner, 0)).should.be.bignumber.equal(thirdTokenId);
      });

      it('adjusts all tokens list', async function () {
        (await this.token.tokenByIndex(2)).should.be.bignumber.equal(thirdTokenId);
      });
    });

    describe('burn', function () {
      beforeEach(async function () {
        await this.token.burn(firstTokenId, { from: owner });
      });

      it('removes that token from the token list of the owner', async function () {
        (await this.token.tokenOfOwnerByIndex(owner, 0)).should.be.bignumber.equal(secondTokenId);
      });

      it('adjusts all tokens list', async function () {
        (await this.token.tokenByIndex(0)).should.be.bignumber.equal(secondTokenId);
      });

      it('burns all tokens', async function () {
        await this.token.burn(secondTokenId, { from: owner });
        (await this.token.totalSupply()).should.be.bignumber.equal('0');
        await shouldFail.reverting.withMessage(
          this.token.tokenByIndex(0), 'ERC721Enumerable: global index out of bounds'
        );
      });
    });

    describe('metadata', function () {
      const sampleUri = 'mock://mytoken';

      it('has a name', async function () {
        (await this.token.name()).should.be.equal(name);
      });

      it('has a symbol', async function () {
        (await this.token.symbol()).should.be.equal(symbol);
      });

      it('sets and returns metadata for a token id', async function () {
        await this.token.setTokenURI(firstTokenId, sampleUri);
        (await this.token.tokenURI(firstTokenId)).should.be.equal(sampleUri);
      });

      it('reverts when setting metadata for non existent token id', async function () {
        await shouldFail.reverting.withMessage(
          this.token.setTokenURI(nonExistentTokenId, sampleUri), 'ERC721Metadata: URI set of nonexistent token'
        );
      });

      it('can burn token with metadata', async function () {
        await this.token.setTokenURI(firstTokenId, sampleUri);
        await this.token.burn(firstTokenId, { from: owner });
        (await this.token.exists(firstTokenId)).should.equal(false);
      });

      it('returns empty metadata for token', async function () {
        (await this.token.tokenURI(firstTokenId)).should.be.equal('');
      });

      it('reverts when querying metadata for non existent token id', async function () {
        await shouldFail.reverting.withMessage(
          this.token.tokenURI(nonExistentTokenId), 'ERC721Metadata: URI query for nonexistent token'
        );
      });
    });

    describe('tokensOfOwner', function () {
      it('returns total tokens of owner', async function () {
        const tokenIds = await this.token.tokensOfOwner(owner);
        tokenIds.length.should.equal(2);
        tokenIds[0].should.be.bignumber.equal(firstTokenId);
        tokenIds[1].should.be.bignumber.equal(secondTokenId);
      });
    });

    describe('totalSupply', function () {
      it('returns total token supply', async function () {
        (await this.token.totalSupply()).should.be.bignumber.equal('2');
      });
    });

    describe('tokenOfOwnerByIndex', function () {
      describe('when the given index is lower than the amount of tokens owned by the given address', function () {
        it('returns the token ID placed at the given index', async function () {
          (await this.token.tokenOfOwnerByIndex(owner, 0)).should.be.bignumber.equal(firstTokenId);
        });
      });

      describe('when the index is greater than or equal to the total tokens owned by the given address', function () {
        it('reverts', async function () {
          await shouldFail.reverting.withMessage(
            this.token.tokenOfOwnerByIndex(owner, 2), 'ERC721Enumerable: owner index out of bounds'
          );
        });
      });

      describe('when the given address does not own any token', function () {
        it('reverts', async function () {
          await shouldFail.reverting.withMessage(
            this.token.tokenOfOwnerByIndex(another, 0), 'ERC721Enumerable: owner index out of bounds'
          );
        });
      });

      describe('after transferring all tokens to another user', function () {
        beforeEach(async function () {
          await this.token.transferFrom(owner, another, firstTokenId, { from: owner });
          await this.token.transferFrom(owner, another, secondTokenId, { from: owner });
        });

        it('returns correct token IDs for target', async function () {
          (await this.token.balanceOf(another)).should.be.bignumber.equal('2');
          const tokensListed = await Promise.all(
            [0, 1].map(i => this.token.tokenOfOwnerByIndex(another, i))
          );
          tokensListed.map(t => t.toNumber()).should.have.members([firstTokenId.toNumber(), secondTokenId.toNumber()]);
        });

        it('returns empty collection for original owner', async function () {
          (await this.token.balanceOf(owner)).should.be.bignumber.equal('0');
          await shouldFail.reverting.withMessage(
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
        tokensListed.map(t => t.toNumber()).should.have.members([firstTokenId.toNumber(), secondTokenId.toNumber()]);
      });

      it('should revert if index is greater than supply', async function () {
        await shouldFail.reverting.withMessage(
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

          (await this.token.totalSupply()).should.be.bignumber.equal('3');

          const tokensListed = await Promise.all(
            [0, 1, 2].map(i => this.token.tokenByIndex(i))
          );
          const expectedTokens = [firstTokenId, secondTokenId, newTokenId, anotherNewTokenId].filter(
            x => (x !== tokenId)
          );
          tokensListed.map(t => t.toNumber()).should.have.members(expectedTokens.map(t => t.toNumber()));
        });
      });
    });
  });

  shouldBehaveLikeERC721(creator, minter, accounts);

  shouldSupportInterfaces([
    'ERC165',
    'ERC721',
    'ERC721Enumerable',
    'ERC721Metadata',
  ]);
});
