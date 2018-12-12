const { shouldBehaveLikePublicRole } = require('../../access/roles/PublicRole.behavior');
const WhitelistedRoleMock = artifacts.require('WhitelistedRoleMock');

contract('WhitelistedRole', function ([_, whitelisted, otherWhitelisted, whitelister, ...otherAccounts]) {
  beforeEach(async function () {
    this.contract = await WhitelistedRoleMock.new({ from: whitelister });
    await this.contract.addWhitelisted(whitelisted, { from: whitelister });
    await this.contract.addWhitelisted(otherWhitelisted, { from: whitelister });
  });

  shouldBehaveLikePublicRole(whitelisted, otherWhitelisted, otherAccounts, 'whitelisted', whitelister);
});
