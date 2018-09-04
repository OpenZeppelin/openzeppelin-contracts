const { shouldBehaveLikeERC20Mintable } = require('./ERC20Mintable.behavior');
const { shouldBehaveLikePublicRole } = require('../../access/rbac/PublicRole.behavior');
const ERC20MintableMock = artifacts.require('ERC20MintableMock');

contract('ERC20Mintable', function ([_, originalMinter, otherMinter, ...otherAccounts]) {
  beforeEach(async function () {
    this.token = await ERC20MintableMock.new([originalMinter, otherMinter]);
  });

  context('with original minter', function () {
    shouldBehaveLikeERC20Mintable(originalMinter, otherAccounts);
  });

  describe('minter role', function () {
    beforeEach(async function () {
      await this.token.addMinter(otherMinter);
      this.contract = this.token;
    });

    shouldBehaveLikePublicRole(originalMinter, otherMinter, otherAccounts, 'minter');
  });
});
