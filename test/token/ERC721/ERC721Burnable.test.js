const { accounts, load } = require('@openzeppelin/test-env');
const [ creator, ...accounts ] = accounts;

require('@openzeppelin/test-helpers');

const { shouldBehaveLikeERC721 } = require('./ERC721.behavior');
const {
  shouldBehaveLikeMintAndBurnERC721,
} = require('./ERC721MintBurn.behavior');

const ERC721BurnableImpl = load.truffle('ERC721MintableBurnableImpl.sol');

describe('ERC721Burnable', function () {
  const minter = creator;

  beforeEach(async function () {
    this.token = await ERC721BurnableImpl.new({ from: creator });
  });

  shouldBehaveLikeERC721(creator, minter, accounts);
  shouldBehaveLikeMintAndBurnERC721(creator, minter, accounts);
});
