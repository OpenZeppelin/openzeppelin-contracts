const { shouldBehaveLikeERC721 } = require('./ERC721.behavior');

const ERC721Mock = artifacts.require('ERC721Mock.sol');

require('../../helpers/setup');

contract('ERC721', function ([_, creator, ...accounts]) {
  beforeEach(async function () {
    this.token = await ERC721Mock.new({ from: creator });
  });

  shouldBehaveLikeERC721(creator, creator, accounts);
});
