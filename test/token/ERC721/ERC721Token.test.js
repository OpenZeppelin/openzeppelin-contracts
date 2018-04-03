import assertRevert from '../../helpers/assertRevert';
import shouldBehaveLikeERC721BasicToken from './ERC721BasicToken.behaviour';
import shouldMintAndBurnERC721Token from './ERC721MintBurn.behaviour';
import _ from 'lodash';

const BigNumber = web3.BigNumber;
const ERC721Token = artifacts.require('ERC721TokenMock.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721Token', function (accounts) {
  const name = 'Non Fungible Token';
  const symbol = 'NFT';
  const firstTokenId = 100;
  const secondTokenId = 200;
  const creator = accounts[0];

  beforeEach(async function () {
    this.token = await ERC721Token.new(name, symbol, { from: creator });
  });

  shouldBehaveLikeERC721BasicToken(accounts);
  shouldMintAndBurnERC721Token(accounts);

  describe('like a full ERC721', function () {
    beforeEach(async function () {
      await this.token.mint(creator, firstTokenId, { from: creator });
      await this.token.mint(creator, secondTokenId, { from: creator });
    });

    describe('mint', function () {
      const to = accounts[1];
      const tokenId = 3;

      beforeEach(async function () {
        await this.token.mint(to, tokenId);
      });

      it('adjusts owner tokens by index', async function () {
        const token = await this.token.tokenOfOwnerByIndex(to, 0);
        token.toNumber().should.be.equal(tokenId);
      });

      it('adjusts all tokens list', async function () {
        const newToken = await this.token.tokenByIndex(2);
        newToken.toNumber().should.be.equal(tokenId);
      });
    });

    describe('burn', function () {
      const tokenId = firstTokenId;
      const sender = creator;

      beforeEach(async function () {
        await this.token.burn(tokenId, { from: sender });
      });

      it('removes that token from the token list of the owner', async function () {
        const token = await this.token.tokenOfOwnerByIndex(sender, 0);
        token.toNumber().should.be.equal(secondTokenId);
      });

      it('adjusts all tokens list', async function () {
        const token = await this.token.tokenByIndex(0);
        token.toNumber().should.be.equal(secondTokenId);
      });

      it('burns all tokens', async function () {
        await this.token.burn(secondTokenId, { from: sender });
        const total = await this.token.totalSupply();
        total.toNumber().should.be.equal(0);
        await assertRevert(this.token.tokenByIndex(0));
      });
    });
    
    describe('metadata', function () {
      const sampleUri = 'mock://mytoken';

      it('has a name', async function () {
        const name = await this.token.name();
        name.should.be.equal(name);
      });

      it('has a symbol', async function () {
        const symbol = await this.token.symbol();
        symbol.should.be.equal(symbol);
      });

      it('sets and returns metadata for a token id', async function () {
        await this.token.setTokenURI(firstTokenId, sampleUri);
        const uri = await this.token.tokenURI(firstTokenId);
        uri.should.be.equal(sampleUri);
      });

      it('can burn token with metadata', async function () {
        await this.token.setTokenURI(firstTokenId, sampleUri);
        await this.token.burn(firstTokenId);
        const exists = await this.token.exists(firstTokenId);
        exists.should.be.false;
      });

      it('returns empty metadata for token', async function () {
        const uri = await this.token.tokenURI(firstTokenId);
        uri.should.be.equal('');
      });

      it('reverts when querying metadata for non existant token id', async function () {
        await assertRevert(this.token.tokenURI(500));
      });
    });

    describe('totalSupply', function () {
      it('returns total token supply', async function () {
        const totalSupply = await this.token.totalSupply();
        totalSupply.should.be.bignumber.equal(2);
      });
    });

    describe('tokenOfOwnerByIndex', function () {
      const owner = creator;
      const another = accounts[1];
        
      describe('when the given index is lower than the amount of tokens owned by the given address', function () {
        it('returns the token ID placed at the given index', async function () {
          const tokenId = await this.token.tokenOfOwnerByIndex(owner, 0);
          tokenId.should.be.bignumber.equal(firstTokenId);
        });
      });

      describe('when the index is greater than or equal to the total tokens owned by the given address', function () {
        it('reverts', async function () {
          await assertRevert(this.token.tokenOfOwnerByIndex(owner, 2));
        });
      });

      describe('when the given address does not own any token', function () {
        it('reverts', async function () {
          await assertRevert(this.token.tokenOfOwnerByIndex(another, 0));
        });
      });

      describe('after transferring all tokens to another user', function () {
        beforeEach(async function () {
          await this.token.transferFrom(owner, another, firstTokenId, { from: owner });
          await this.token.transferFrom(owner, another, secondTokenId, { from: owner });
        });

        it('returns correct token IDs for target', async function () {
          const count = await this.token.balanceOf(another);
          count.toNumber().should.be.equal(2);
          const tokensListed = await Promise.all(_.range(2).map(i => this.token.tokenOfOwnerByIndex(another, i)));
          tokensListed.map(t => t.toNumber()).should.have.members([firstTokenId, secondTokenId]);
        });

        it('returns empty collection for original owner', async function () {
          const count = await this.token.balanceOf(owner);
          count.toNumber().should.be.equal(0);
          await assertRevert(this.token.tokenOfOwnerByIndex(owner, 0));
        });
      });
    });

    describe('tokenByIndex', function () {
      it('should return all tokens', async function () {
        const tokensListed = await Promise.all(_.range(2).map(i => this.token.tokenByIndex(i)));
        tokensListed.map(t => t.toNumber()).should.have.members([firstTokenId, secondTokenId]);
      });

      it('should revert if index is greater than supply', async function () {
        await assertRevert(this.token.tokenByIndex(2));
      });

      [firstTokenId, secondTokenId].forEach(function (tokenId) {
        it(`should return all tokens after burning token ${tokenId} and minting new tokens`, async function () {
          const owner = accounts[0];
          const newTokenId = 300;
          const anotherNewTokenId = 400;
          
          await this.token.burn(tokenId, { from: owner });
          await this.token.mint(owner, newTokenId, { from: owner });
          await this.token.mint(owner, anotherNewTokenId, { from: owner });
  
          const count = await this.token.totalSupply();
          count.toNumber().should.be.equal(3);
          
          const tokensListed = await Promise.all(_.range(3).map(i => this.token.tokenByIndex(i)));
          const expectedTokens = _.filter(
            [firstTokenId, secondTokenId, newTokenId, anotherNewTokenId],
            x => (x !== tokenId)
          );
          tokensListed.map(t => t.toNumber()).should.have.members(expectedTokens);
        });
      });
    });
  });
});
