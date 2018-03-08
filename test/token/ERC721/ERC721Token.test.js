import assertRevert from '../../helpers/assertRevert';
import shouldBehaveLikeERC721BasicToken from './ERC721BasicToken.behaviour';
import shouldMintAndBurnERC721Token from './ERC721MintBurn.behaviour';

const BigNumber = web3.BigNumber;
const ERC721Token = artifacts.require('ERC721TokenMock.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721Token', function (accounts) {
  const name = 'Non Fungible Token';
  const symbol = 'NFT';
  const firstTokenId = 1;
  const secondTokenId = 2;
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

    describe('metadata', function () {
      it('has a name', async function () {
        const name = await this.token.name();
        name.should.be.equal(name);
      });

      it('has a symbol', async function () {
        const symbol = await this.token.symbol();
        symbol.should.be.equal(symbol);
      });

      it('returns metadata for a token id', async function () {
        const uri = await this.token.tokenURI(firstTokenId);
        const expected = `mock://${firstTokenId.toString().padStart(78, 0)}`;
        uri.should.be.equal(expected);
      });
    });

    describe('totalSupply', function () {
      it('returns total token supply', async function () {
        const totalSupply = await this.token.totalSupply();
        totalSupply.should.be.bignumber.equal(2);
      });
    });

    describe('tokenOfOwnerByIndex', function () {
      describe('when the given address owns some tokens', function () {
        const owner = creator;

        describe('when the given index is lower than the amount of tokens owned by the given address', function () {
          const index = 0;

          it('returns the token ID placed at the given index', async function () {
            const tokenId = await this.token.tokenOfOwnerByIndex(owner, index);
            tokenId.should.be.bignumber.equal(firstTokenId);
          });
        });

        describe('when the index is greater than or equal to the total tokens owned by the given address', function () {
          const index = 2;

          it('reverts', async function () {
            await assertRevert(this.token.tokenOfOwnerByIndex(owner, index));
          });
        });
      });

      describe('when the given address does not own any token', function () {
        const owner = accounts[1];

        it('reverts', async function () {
          await assertRevert(this.token.tokenOfOwnerByIndex(owner, 0));
        });
      });
    });
  });
});
