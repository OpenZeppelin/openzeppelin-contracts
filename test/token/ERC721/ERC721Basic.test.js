const { shouldBehaveLikeERC721Basic } = require('./ERC721Basic.behavior');
const { shouldBehaveLikeMintAndBurnERC721 } = require('./ERC721MintBurn.behavior');

const BigNumber = web3.BigNumber;
const ERC721Basic = artifacts.require('ERC721BasicMock.sol');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721Basic', function (accounts) {
  beforeEach(async function () {
    this.token = await ERC721Basic.new({ from: accounts[0] });
  });

  shouldBehaveLikeERC721Basic(accounts);
  shouldBehaveLikeMintAndBurnERC721(accounts);
});
