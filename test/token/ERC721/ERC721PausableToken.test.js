const { shouldBehaveLikeERC721PausableToken } = require('./ERC721PausableToken.behavior');

const BigNumber = web3.BigNumber;
const ERC721PausableToken = artifacts.require('ERC721PausableTokenMock.sol');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721PausableToken', function (accounts) {
  beforeEach(async function () {
    this.token = await ERC721PausableToken.new({ from: accounts[0] });
  });

  shouldBehaveLikeERC721PausableToken(accounts);
});
