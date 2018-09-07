const { shouldBehaveLikeERC721Basic } = require('./ERC721Basic.behavior');
const {
  shouldBehaveLikeMintAndBurnERC721,
} = require('./ERC721MintBurn.behavior');

const BigNumber = web3.BigNumber;
const ERC721Burnable = artifacts.require('ERC721MintableBurnableImpl.sol');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721Burnable', function ([_, creator, ...accounts]) {
  const minter = creator;

  beforeEach(async function () {
    this.token = await ERC721Burnable.new({ from: creator });
  });

  shouldBehaveLikeERC721Basic(creator, minter, accounts);
  shouldBehaveLikeMintAndBurnERC721(creator, minter, accounts);
});
