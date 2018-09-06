const { shouldBehaveLikeERC721PausedToken } = require('./ERC721PausedToken.behavior');
const { shouldBehaveLikeERC721Basic } = require('./ERC721Basic.behavior');
const { shouldBehaveLikePublicRole } = require('../../access/rbac/PublicRole.behavior');

const BigNumber = web3.BigNumber;
const ERC721Pausable = artifacts.require('ERC721PausableMock.sol');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721Pausable', function ([_, pauser, otherPauser, recipient, operator, ...otherAccounts]) {
  beforeEach(async function () {
    this.token = await ERC721Pausable.new({ from: pauser });
  });

  describe('pauser role', function () {
    beforeEach(async function () {
      this.contract = this.token;
      await this.contract.addPauser(otherPauser, { from: pauser });
    });

    shouldBehaveLikePublicRole(pauser, otherPauser, otherAccounts, 'pauser');
  });

  context('when token is paused', function () {
    beforeEach(async function () {
      await this.token.pause({ from: pauser });
    });

    shouldBehaveLikeERC721PausedToken(pauser, [...otherAccounts]);
  });

  context('when token is not paused yet', function () {
    shouldBehaveLikeERC721Basic([pauser, ...otherAccounts]);
  });

  context('when token is paused and then unpaused', function () {
    beforeEach(async function () {
      await this.token.pause({ from: pauser });
      await this.token.unpause({ from: pauser });
    });

    shouldBehaveLikeERC721Basic([pauser, ...otherAccounts]);
  });
});
