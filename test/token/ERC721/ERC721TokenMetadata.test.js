import assertRevert from '../../helpers/assertRevert';
const BigNumber = web3.BigNumber;
const ERC721TokenMetadata = artifacts.require('ERC721TokenMetadataMock.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721TokenMetadata', accounts => {
  let token = null;
  const _name = 'Non Fungible Token';
  const _symbol = 'NFT';
  const _firstTokenId = 1;
  const _secondTokenId = 2;
  const _unknownTokenId = 3;
  const _creator = accounts[0];

  beforeEach(async function () {
    token = await ERC721TokenMetadata.new(_name, _symbol, { from: _creator });
    await token.mint(_creator, _firstTokenId, { from: _creator });
    await token.mint(_creator, _secondTokenId, { from: _creator });
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
