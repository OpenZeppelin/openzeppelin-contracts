const { shouldBehaveLikePublicRole } = require('../../access/roles/PublicRole.behavior');
const WhitelistAdminRoleMock = artifacts.require('WhitelistAdminRoleMock');

contract('WhitelistAdminRole', function ([_, whitelistAdmin, otherWhitelistAdmin, ...otherAccounts]) {
  beforeEach(async function () {
    this.contract = await WhitelistAdminRoleMock.new({ from: whitelistAdmin });
    await this.contract.addWhitelistAdmin(otherWhitelistAdmin, { from: whitelistAdmin });
  });

  shouldBehaveLikePublicRole(whitelistAdmin, otherWhitelistAdmin, otherAccounts, 'whitelistAdmin');
});
