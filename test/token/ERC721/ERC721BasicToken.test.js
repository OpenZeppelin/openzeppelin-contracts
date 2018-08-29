const { shouldBehaveLikeERC721BasicToken } = require('./ERC721BasicToken.behavior');
const { shouldBehaveLikeMintAndBurnERC721 } = require('./ERC721MintBurn.behavior');

const BigNumber = web3.BigNumber;
const ERC721BasicToken = artifacts.require('ERC721BasicTokenMock.sol');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721BasicToken', function (accounts) {
  beforeEach(async function () {
    this.token = await ERC721BasicToken.new({ from: accounts[0] });
  });

  shouldBehaveLikeERC721BasicToken(accounts);
  shouldBehaveLikeMintAndBurnERC721(accounts);
});
