const { shouldBehaveLikeERC20Mintable } = require('./ERC20Mintable.behavior');
const { shouldBehaveLikePublicRole } = require('../../access/rbac/PublicRole.behavior');
const ERC20MintableMock = artifacts.require('ERC20MintableMock');

contract('ERC20Mintable', function ([_, minter, otherMinter, ...otherAccounts]) {
  beforeEach(async function () {
    this.token = await ERC20MintableMock.new({ from: minter });
  });

  context('with original minter', function () {
    shouldBehaveLikeERC20Mintable(minter, otherAccounts);
  });

  describe('minter role', function () {
    beforeEach(async function () {
      await this.token.addMinter(otherMinter, { from: minter });
      this.contract = this.token;
    });

    shouldBehaveLikePublicRole(minter, otherMinter, otherAccounts, 'minter');
  });
});
