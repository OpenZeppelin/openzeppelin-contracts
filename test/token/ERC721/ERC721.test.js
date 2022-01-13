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
});
