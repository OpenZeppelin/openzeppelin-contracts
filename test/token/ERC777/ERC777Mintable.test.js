const { accounts, contract } = require('@openzeppelin/test-environment');

const { shouldBehaveLikeERC777Mintable } = require('./behaviors/ERC777Mintable.behavior');
const ERC777MintableMock = contract.fromArtifact('ERC777MintableMock');
const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');

describe('ERC777Mintable', function () {
  const [ minter, otherMinter, ...otherAccounts ] = accounts;

  beforeEach(async function () {
    this.token = await ERC777MintableMock.new({ from: minter });
  });

  describe('minter role', function () {
    beforeEach(async function () {
      this.contract = this.token;
      await this.contract.addMinter(otherMinter, { from: minter });
    });

    shouldBehaveLikePublicRole(minter, otherMinter, otherAccounts, 'minter');
  });

  shouldBehaveLikeERC777Mintable(minter, otherAccounts);
});
