const { accounts, contract } = require('@openzeppelin/test-environment');

require('@openzeppelin/test-helpers');
const { shouldBehaveLikeERC721 } = require('./ERC721.behavior');
const { shouldBehaveLikeMintAndBurnERC721 } = require('./ERC721MintBurn.behavior');

const ERC721MintableImpl = contract.fromArtifact('ERC721MintableBurnableImpl');

describe('ERC721Mintable', function () {
  const [ creator, ...otherAccounts ] = accounts;
  const minter = creator;

  beforeEach(async function () {
    this.token = await ERC721MintableImpl.new({
      from: creator,
    });
  });

  shouldBehaveLikeERC721(creator, minter, otherAccounts);
  shouldBehaveLikeMintAndBurnERC721(creator, minter, otherAccounts);
});
