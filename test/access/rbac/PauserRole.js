const { shouldBehaveLikePublicRole } = require('../../access/rbac/PublicRole.behavior');
const PauserRoleMock = artifacts.require('PauserRoleMock');

contract('PauserRole', function ([_, Pauser, otherPauser, ...otherAccounts]) {
  beforeEach(async function () {
    this.contract = await PauserRoleMock.new({ from: Pauser });
    await this.contract.addPauser(otherPauser, { from: Pauser });
  });

  shouldBehaveLikePublicRole(Pauser, otherPauser, otherAccounts, 'pauser');
});
