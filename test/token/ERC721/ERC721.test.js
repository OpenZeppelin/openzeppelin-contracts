const { shouldBehaveLikeERC721, shouldBehaveLikeERC721Metadata } = require('./ERC721.behavior');

const ERC721 = artifacts.require('$ERC721');

contract('ERC721', function (accounts) {
  const name = 'Non Fungible Token';
  const symbol = 'NFT';

  beforeEach(async function () {
    this.token = await ERC721.new(name, symbol);
  });

  shouldBehaveLikeERC721(...accounts);
  shouldBehaveLikeERC721Metadata(name, symbol, ...accounts);
});
