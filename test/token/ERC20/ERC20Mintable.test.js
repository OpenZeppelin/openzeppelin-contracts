const { accounts, contract } = require('@openzeppelin/test-environment');

const { shouldBehaveLikeERC20Mintable } = require('./behaviors/ERC20Mintable.behavior');
const ERC20MintableMock = contract.fromArtifact('ERC20MintableMock');
const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');

describe('ERC20Mintable', function () {
  const [ minter, otherMinter, ...otherAccounts ] = accounts;

  beforeEach(async function () {
    this.token = await ERC20MintableMock.new({ from: minter });
  });

  describe('minter role', function () {
    beforeEach(async function () {
      this.contract = this.token;
      await this.contract.addMinter(otherMinter, { from: minter });
    });

    shouldBehaveLikePublicRole(minter, otherMinter, otherAccounts, 'minter');
  });

  shouldBehaveLikeERC20Mintable(minter, otherAccounts);
});
