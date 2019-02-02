const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');
const EnumerableRoleMock = artifacts.require('EnumerableRoleMock');

contract('EnumerableRole', function ([_, enumerable, otherEnumerable, ...otherAccounts]) {
  beforeEach(async function () {
    this.contract = await EnumerableRoleMock.new({ from: enumerable });
    await this.contract.addEnumerable(otherEnumerable, { from: enumerable });
  });

  shouldBehaveLikePublicRole(enumerable, otherEnumerable, otherAccounts, 'enumerable');
});
