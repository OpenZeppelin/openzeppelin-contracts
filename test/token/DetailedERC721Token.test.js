import assertRevert from '../helpers/assertRevert';
const BigNumber = web3.BigNumber;
const DetailedERC721Token = artifacts.require('DetailedERC721TokenMock.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('DetailedERC721Token', accounts => {
  let token = null;
  const _name = 'Non Fungible Token';
  const _symbol = 'NFT';
  const _firstTokenId = 1;
  const _secondTokenId = 2;
  const _unknownTokenId = 3;
  const _creator = accounts[0];

  beforeEach(async function () {
    token = await DetailedERC721Token.new(_name, _symbol, { from: _creator });
    await token.publicMint(_creator, _firstTokenId, { from: _creator });
    await token.publicMint(_creator, _secondTokenId, { from: _creator });
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

  describe('tokenMetadata', function () {
    describe('when no metadata was set', function () {
      it('the given token has no metadata', async function () {
        const metadata = await token.tokenMetadata(_firstTokenId);

        metadata.should.be.equal('');
      });
    });

    describe('when some metadata was set', function () {
      it('returns the metadata of the given token', async function () {
        await token.setTokenMetadata(_firstTokenId, 'dummy metadata', { from: _creator });

        const metadata = await token.tokenMetadata(_firstTokenId);

        metadata.should.be.equal('dummy metadata');
      });
    });
  });

  describe('setTokenMetadata', function () {
    describe('when the sender is not the token owner', function () {
      const sender = accounts[1];

      it('reverts', async function () {
        await assertRevert(token.setTokenMetadata(_firstTokenId, 'new metadata', { from: sender }));
      });
    });

    describe('when the sender is the owner of the token', function () {
      const sender = _creator;

      describe('when the given token ID was tracked by this contract before', function () {
        const tokenId = _firstTokenId;

        it('updates the metadata of the given token ID', async function () {
          await token.setTokenMetadata(_firstTokenId, 'new metadata', { from: sender });

          const metadata = await token.tokenMetadata(tokenId);

          metadata.should.be.equal('new metadata');
        });

        it('emits a metadata updated event', async function () {
          const { logs } = await token.setTokenMetadata(tokenId, 'new metadata', { from: sender });

          logs.length.should.be.equal(1);
          logs[0].event.should.be.eq('MetadataUpdated');
          logs[0].args._owner.should.be.equal(sender);
          logs[0].args._tokenId.should.be.bignumber.equal(tokenId);
          logs[0].args._newMetadata.should.be.equal('new metadata');
        });
      });

      describe('when the given token ID was not tracked by this contract before', function () {
        const tokenId = _unknownTokenId;

        it('reverts', async function () {
          await assertRevert(token.setTokenMetadata(tokenId, 'new metadata'), { from: sender });
        });
      });
    });
  });
});
