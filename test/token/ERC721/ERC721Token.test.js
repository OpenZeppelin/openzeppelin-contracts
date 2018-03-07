import assertRevert from '../../helpers/assertRevert';
const BigNumber = web3.BigNumber;
const ERC721Token = artifacts.require('ERC721TokenMock.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721Token', accounts => {
  let token = null;
  const _name = 'Non Fungible Token';
  const _symbol = 'NFT';
  const _firstTokenId = 1;
  const _secondTokenId = 2;
  const _creator = accounts[0];

  beforeEach(async function () {
    token = await ERC721Token.new(_name, _symbol, { from: _creator });
    await token.mint(_creator, _firstTokenId, { from: _creator });
    await token.mint(_creator, _secondTokenId, { from: _creator });
  });

  describe('name', function () {
    it('has a name', async function () {
      const name = await token.name();
      name.should.be.equal(_name);
    });
  });

  describe('symbol', function () {
    it('has a symbol', async function () {
      const symbol = await token.symbol();
      symbol.should.be.equal(_symbol);
    });
  });

  describe('tokenOfOwnerByIndex', function () {
    describe('when the given address owns some tokens', function () {
      const owner = _creator;

      describe('when the given index is lower than the amount of tokens owned by the given address', function () {
        const index = 0;

        it('returns the token ID placed at the given index', async function () {
          const tokenId = await token.tokenOfOwnerByIndex(owner, index);
          tokenId.should.be.bignumber.equal(_firstTokenId);
        });
      });

      describe('when the index is greater than or equal to the total tokens owned by the given address', function () {
        const index = 2;

        it('reverts', async function () {
          await assertRevert(token.tokenOfOwnerByIndex(owner, index));
        });
      });
    });

    describe('when the given address does not own any token', function () {
      const owner = accounts[1];

      it('reverts', async function () {
        await assertRevert(token.tokenOfOwnerByIndex(owner, 0));
      });
    });
  });
});
