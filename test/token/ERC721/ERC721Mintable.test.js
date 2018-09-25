const { shouldBehaveLikeERC721 } = require('./ERC721.behavior');
const {
  shouldBehaveLikeMintAndBurnERC721,
} = require('./ERC721MintBurn.behavior');

const BigNumber = web3.BigNumber;
const ERC721Mintable = artifacts.require('ERC721MintableBurnableImpl.sol');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721Mintable', function ([_, creator, ...accounts]) {
  const minter = creator;

  beforeEach(async function () {
    this.token = await ERC721Mintable.new({
      from: creator,
    });
  });

  shouldBehaveLikeERC721(creator, minter, accounts);
  shouldBehaveLikeMintAndBurnERC721(creator, minter, accounts);
});
