const {
  shouldBehaveLikeERC721,
  shouldBehaveLikeERC721Metadata,
  shouldBehaveLikeERC721Enumerable,
} = require('./ERC721.behavior');

const ERC721Enumerable = artifacts.require('$ERC721Enumerable');

contract('ERC721Enumerable', function (accounts) {
  const name = 'Non Fungible Token';
  const symbol = 'NFT';

  beforeEach(async function () {
    this.token = await ERC721Enumerable.new(name, symbol);
  });

  shouldBehaveLikeERC721('ERC721', ...accounts);
  shouldBehaveLikeERC721Metadata('ERC721', name, symbol, ...accounts);
  shouldBehaveLikeERC721Enumerable('ERC721', ...accounts);
});
