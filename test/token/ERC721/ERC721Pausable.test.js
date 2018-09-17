const { shouldBehaveLikeERC721PausedToken } = require('./ERC721PausedToken.behavior');
const { shouldBehaveLikeERC721 } = require('./ERC721.behavior');
const { shouldBehaveLikePublicRole } = require('../../access/roles/PublicRole.behavior');

const BigNumber = web3.BigNumber;
const ERC721Pausable = artifacts.require('ERC721PausableMock.sol');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721Pausable', function ([
  _,
  creator,
  owner,
  operator,
  otherPauser,
  ...accounts
]) {
  beforeEach(async function () {
    this.token = await ERC721Pausable.new({ from: creator });
  });

  describe('pauser role', function () {
    beforeEach(async function () {
      this.contract = this.token;
      await this.contract.addPauser(otherPauser, { from: creator });
    });

    shouldBehaveLikePublicRole(creator, otherPauser, accounts, 'pauser');
  });

  context('when token is paused', function () {
    beforeEach(async function () {
      await this.token.pause({ from: creator });
    });

    shouldBehaveLikeERC721PausedToken(creator, accounts);
  });

  context('when token is not paused yet', function () {
    shouldBehaveLikeERC721(creator, creator, accounts);
  });

  context('when token is paused and then unpaused', function () {
    beforeEach(async function () {
      await this.token.pause({ from: creator });
      await this.token.unpause({ from: creator });
    });

    shouldBehaveLikeERC721(creator, creator, accounts);
  });
});
