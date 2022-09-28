const {
  shouldBehaveLikeERC4907,
} = require('./ERC4907.behavior');
const ERC4907Mock = artifacts.require('ERC4907Mock');
contract('ERC4907', function (accounts) {
  const name = 'Non Fungible Token 4907';
  const symbol = 'NFT4907';
  beforeEach(async function () {
    this.token = await ERC4907Mock.new(name, symbol);
  });
  shouldBehaveLikeERC4907('ERC4907', ...accounts);
});
