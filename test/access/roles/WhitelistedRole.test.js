const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');
const WhitelistedRoleMock = artifacts.require('WhitelistedRoleMock');

contract('WhitelistedRole', function ([_, whitelisted, otherWhitelisted, whitelistAdmin, ...otherAccounts]) {
  beforeEach(async function () {
    this.contract = await WhitelistedRoleMock.new({ from: whitelistAdmin });
    await this.contract.addWhitelisted(whitelisted, { from: whitelistAdmin });
    await this.contract.addWhitelisted(otherWhitelisted, { from: whitelistAdmin });
  });

  shouldBehaveLikePublicRole(whitelisted, otherWhitelisted, otherAccounts, 'whitelisted', whitelistAdmin);
});
