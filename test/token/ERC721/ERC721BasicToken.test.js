const { shouldBehaveLikeERC721BasicToken } = require('./ERC721BasicToken.behaviour');
const { shouldBehaveLikeMintAndBurnERC721Token } = require('./ERC721MintBurn.behaviour');

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
  shouldBehaveLikeMintAndBurnERC721Token(accounts);
});
