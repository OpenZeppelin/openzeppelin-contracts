require('openzeppelin-test-helpers');

const { shouldBehaveLikeERC721 } = require('./ERC721.behavior');
const {
  shouldBehaveLikeMintAndBurnERC721,
} = require('./ERC721MintBurn.behavior');

const ERC721BurnableImpl = artifacts.require('ERC721MintableBurnableImpl.sol');

contract('ERC721Burnable', function ([_, creator, ...accounts]) {
  const minter = creator;

  beforeEach(async function () {
    this.token = await ERC721BurnableImpl.new({ from: creator });
  });

  shouldBehaveLikeERC721(creator, minter, accounts);
  shouldBehaveLikeMintAndBurnERC721(creator, minter, accounts);
});
