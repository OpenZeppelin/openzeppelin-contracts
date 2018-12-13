const { shouldBehaveLikePublicRole } = require('../../access/roles/PublicRole.behavior');
const WhitelisterRoleMock = artifacts.require('WhitelisterRoleMock');

contract('WhitelisterRole', function ([_, whitelister, otherWhitelister, ...otherAccounts]) {
  beforeEach(async function () {
    this.contract = await WhitelisterRoleMock.new({ from: whitelister });
    await this.contract.addWhitelister(otherWhitelister, { from: whitelister });
  });

  shouldBehaveLikePublicRole(whitelister, otherWhitelister, otherAccounts, 'whitelister');
});
