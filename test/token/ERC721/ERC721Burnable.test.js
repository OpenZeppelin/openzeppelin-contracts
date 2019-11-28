const { accounts, contract } = require('@openzeppelin/test-environment');

require('@openzeppelin/test-helpers');

const { shouldBehaveLikeERC721 } = require('./ERC721.behavior');
const {
  shouldBehaveLikeMintAndBurnERC721,
} = require('./ERC721MintBurn.behavior');

const ERC721BurnableImpl = contract.fromArtifact('ERC721MintableBurnableImpl');

describe('ERC721Burnable', function () {
  const [ creator, ...otherAccounts ] = accounts;
  const minter = creator;

  beforeEach(async function () {
    this.token = await ERC721BurnableImpl.new({ from: creator });
  });

  shouldBehaveLikeERC721(creator, minter, otherAccounts);
  shouldBehaveLikeMintAndBurnERC721(creator, minter, otherAccounts);
});
