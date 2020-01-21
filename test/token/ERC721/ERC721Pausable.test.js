const { accounts, contract } = require('@openzeppelin/test-environment');

require('@openzeppelin/test-helpers');
const { shouldBehaveLikeERC721PausedToken } = require('./ERC721PausedToken.behavior');
const { shouldBehaveLikeERC721 } = require('./ERC721.behavior');
const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');

const ERC721PausableMock = contract.fromArtifact('ERC721PausableMock');

describe('ERC721Pausable', function () {
  const [ creator, otherPauser, ...otherAccounts ] = accounts;

  beforeEach(async function () {
    this.token = await ERC721PausableMock.new({ from: creator });
  });

  describe('pauser role', function () {
    beforeEach(async function () {
      this.contract = this.token;
      await this.contract.addPauser(otherPauser, { from: creator });
    });

    shouldBehaveLikePublicRole(creator, otherPauser, otherAccounts, 'pauser');
  });

  context('when token is paused', function () {
    beforeEach(async function () {
      await this.token.pause({ from: creator });
    });

    shouldBehaveLikeERC721PausedToken(creator, otherAccounts);
  });

  context('when token is not paused yet', function () {
    shouldBehaveLikeERC721(creator, creator, otherAccounts);
  });

  context('when token is paused and then unpaused', function () {
    beforeEach(async function () {
      await this.token.pause({ from: creator });
      await this.token.unpause({ from: creator });
    });

    shouldBehaveLikeERC721(creator, creator, otherAccounts);
  });
});
