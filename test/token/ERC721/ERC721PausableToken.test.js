const { shouldBehaveLikeERC721PausedToken } = require('./ERC721PausedToken.behavior');
const { shouldBehaveLikeERC721BasicToken } = require('./ERC721BasicToken.behavior');

const BigNumber = web3.BigNumber;
const ERC721PausableToken = artifacts.require('ERC721PausableTokenMock.sol');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721PausableToken', function ([_, owner, recipient, operator, ...otherAccounts]) {
  beforeEach(async function () {
    this.token = await ERC721PausableToken.new({ from: owner });
  });

  context('when token is paused', function () {
    beforeEach(async function () {
      await this.token.pause({ from: owner });
    });

    shouldBehaveLikeERC721PausedToken(owner, [...otherAccounts]);
  });

  context('when token is not paused yet', function () {
    shouldBehaveLikeERC721BasicToken([owner, ...otherAccounts]);
  });

  context('when token is paused and then unpaused', function () {
    beforeEach(async function () {
      await this.token.pause({ from: owner });
      await this.token.unpause({ from: owner });
    });

    shouldBehaveLikeERC721BasicToken([owner, ...otherAccounts]);
  });
});
