const { assertRevert } = require('../../helpers/assertRevert');
const { shouldBehaveLikeERC721Basic } = require('./ERC721Basic.behavior');
const { shouldBehaveLikeMintAndBurnERC721 } = require('./ERC721MintBurn.behavior');
const { shouldSupportInterfaces } = require('../../introspection/SupportsInterface.behavior');

const BigNumber = web3.BigNumber;
const ERC721 = artifacts.require('ERC721Mock.sol');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721', function ([_, owner, anyone, ...otherAccounts]) {
  const name = 'Non Fungible Token';
  const symbol = 'NFT';
  const firstTokenId = 100;
  const secondTokenId = 200;
  const nonExistentTokenId = 999;

  beforeEach(async function () {
    this.token = await ERC721.new(name, symbol, { from: owner });
  });

  shouldBehaveLikeERC721Basic(owner, otherAccounts);
  shouldBehaveLikeMintAndBurnERC721(owner, otherAccounts);

  describe('like a full ERC721', function () {
    beforeEach(async function () {
      await this.token.mint(owner, firstTokenId, { from: owner });
      await this.token.mint(owner, secondTokenId, { from: owner });
    });

    describe('mint', function () {
      const to = anyone;
      const tokenId = 3;

      beforeEach(async function () {
        await this.token.mint(to, tokenId);
      });

      it('adjusts owner tokens by index', async function () {
        (await this.token.tokenOfOwnerByIndex(to, 0)).toNumber().should.be.equal(tokenId);
      });

      it('adjusts all tokens list', async function () {
        (await this.token.tokenByIndex(2)).toNumber().should.be.equal(tokenId);
      });
    });

    describe('burn', function () {
      const tokenId = firstTokenId;
      const sender = owner;

      beforeEach(async function () {
        await this.token.burn(tokenId, { from: sender });
      });

      it('removes that token from the token list of the owner', async function () {
        (await this.token.tokenOfOwnerByIndex(sender, 0)).toNumber().should.be.equal(secondTokenId);
      });

      it('adjusts all tokens list', async function () {
        (await this.token.tokenByIndex(0)).toNumber().should.be.equal(secondTokenId);
      });

      it('burns all tokens', async function () {
        await this.token.burn(secondTokenId, { from: sender });
        (await this.token.totalSupply()).toNumber().should.be.equal(0);
        await assertRevert(this.token.tokenByIndex(0));
      });
    });

    describe('removeTokenFrom', function () {
      it('reverts if the correct owner is not passed', async function () {
        await assertRevert(
          this.token.removeTokenFrom(anyone, firstTokenId, { from: owner })
        );
      });

      context('once removed', function () {
        beforeEach(async function () {
          await this.token.removeTokenFrom(owner, firstTokenId, { from: owner });
        });

        it('has been removed', async function () {
          await assertRevert(this.token.tokenOfOwnerByIndex(owner, 1));
        });

        it('adjusts token list', async function () {
          (await this.token.tokenOfOwnerByIndex(owner, 0)).toNumber().should.be.equal(secondTokenId);
        });

        it('adjusts owner count', async function () {
          (await this.token.balanceOf(owner)).toNumber().should.be.equal(1);
        });

        it('does not adjust supply', async function () {
          (await this.token.totalSupply()).toNumber().should.be.equal(2);
        });
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
        await assertRevert(this.token.setTokenURI(nonExistentTokenId, sampleUri));
      });

      it('can burn token with metadata', async function () {
        await this.token.setTokenURI(firstTokenId, sampleUri);
        await this.token.burn(firstTokenId);
        (await this.token.exists(firstTokenId)).should.equal(false);
      });

      it('returns empty metadata for token', async function () {
        (await this.token.tokenURI(firstTokenId)).should.be.equal('');
      });

      it('reverts when querying metadata for non existent token id', async function () {
        await assertRevert(this.token.tokenURI(nonExistentTokenId));
      });
    });

    describe('totalSupply', function () {
      it('returns total token supply', async function () {
        (await this.token.totalSupply()).should.be.bignumber.equal(2);
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
          await assertRevert(this.token.tokenOfOwnerByIndex(owner, 2));
        });
      });

      describe('when the given address does not own any token', function () {
        it('reverts', async function () {
          await assertRevert(this.token.tokenOfOwnerByIndex(anyone, 0));
        });
      });

      describe('after transferring all tokens to another user', function () {
        beforeEach(async function () {
          await this.token.transferFrom(owner, anyone, firstTokenId, { from: owner });
          await this.token.transferFrom(owner, anyone, secondTokenId, { from: owner });
        });

        it('returns correct token IDs for target', async function () {
          (await this.token.balanceOf(anyone)).toNumber().should.be.equal(2);
          const tokensListed = await Promise.all(
            [0, 1].map(i => this.token.tokenOfOwnerByIndex(anyone, i))
          );
          tokensListed.map(t => t.toNumber()).should.have.members([firstTokenId, secondTokenId]);
        });

        it('returns empty collection for original owner', async function () {
          (await this.token.balanceOf(owner)).toNumber().should.be.equal(0);
          await assertRevert(this.token.tokenOfOwnerByIndex(owner, 0));
        });
      });
    });

    describe('tokenByIndex', function () {
      it('should return all tokens', async function () {
        const tokensListed = await Promise.all(
          [0, 1].map(i => this.token.tokenByIndex(i))
        );
        tokensListed.map(t => t.toNumber()).should.have.members([firstTokenId, secondTokenId]);
      });

      it('should revert if index is greater than supply', async function () {
        await assertRevert(this.token.tokenByIndex(2));
      });

      [firstTokenId, secondTokenId].forEach(function (tokenId) {
        it(`should return all tokens after burning token ${tokenId} and minting new tokens`, async function () {
          const newTokenId = 300;
          const anotherNewTokenId = 400;

          await this.token.burn(tokenId, { from: owner });
          await this.token.mint(owner, newTokenId, { from: owner });
          await this.token.mint(owner, anotherNewTokenId, { from: owner });

          (await this.token.totalSupply()).toNumber().should.be.equal(3);

          const tokensListed = await Promise.all(
            [0, 1, 2].map(i => this.token.tokenByIndex(i))
          );
          const expectedTokens = [firstTokenId, secondTokenId, newTokenId, anotherNewTokenId].filter(
            x => (x !== tokenId)
          );
          tokensListed.map(t => t.toNumber()).should.have.members(expectedTokens);
        });
      });
    });
  });

  shouldSupportInterfaces([
    'ERC165',
    'ERC721',
    'ERC721Enumerable',
    'ERC721Metadata',
  ]);
});
