const {
  shouldBehaveLikeERC721,
  shouldBehaveLikeERC721Metadata,
} = require('./ERC721.behavior');

const ERC721Mock = artifacts.require('ERC721Mock');

contract('ERC721', function (accounts) {
  const name = 'Non Fungible Token';
  const symbol = 'NFT';

  beforeEach(async function () {
    this.token = await ERC721Mock.new(name, symbol);
  });

  shouldBehaveLikeERC721('ERC721', ...accounts);
  shouldBehaveLikeERC721Metadata('ERC721', name, symbol, ...accounts);

  describe('default tokenUri', function () {
    beforeEach(async function () {
      this.tokenId = '5042';
      await this.token.mint(accounts[0], this.tokenId);
    });

    it('baseURI is empty', async function () {
      expect(await this.token.baseURI()).to.be.equal('');
    });

    it('tokenURI', async function () {
      expect(await this.token.tokenURI(this.tokenId)).to.be.equal('');
    });
  });
});
