const { shouldBehaveLikeERC721 } = require('./ERC721.behavior');
const {
  shouldBehaveLikeMintAndBurnERC721,
} = require('./ERC721MintBurn.behavior');

const ERC721MintableImpl = artifacts.require('ERC721MintableBurnableImpl.sol');

require('../../helpers/setup');

contract('ERC721Mintable', function ([_, creator, ...accounts]) {
  const minter = creator;

  beforeEach(async function () {
    this.token = await ERC721MintableImpl.new({
      from: creator,
    });
  });

  shouldBehaveLikeERC721(creator, minter, accounts);
  shouldBehaveLikeMintAndBurnERC721(creator, minter, accounts);
});
