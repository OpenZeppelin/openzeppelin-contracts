const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');
const EnumerableRoleMock = artifacts.require('EnumerableRoleMock');

contract('EnumerableRole', function ([_, authorized, otherAuthorized, ...otherAccounts]) {
  beforeEach(async function () {
    this.contract = await EnumerableRoleMock.new({ from: authorized });
    await this.contract.addRole(otherAuthorized, { from: authorized });
  });

  shouldBehaveLikePublicRole(authorized, otherAuthorized, otherAccounts, 'enumerable');
});
