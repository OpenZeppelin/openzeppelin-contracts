const { shouldBehaveLikePublicRole } = require('../../access/roles/PublicRole.behavior');
const WhitelisteeRoleMock = artifacts.require('WhitelisteeRoleMock');

contract('WhitelisteeRole', function ([_, whitelistee, otherWhitelistee, whitelister, ...otherAccounts]) {
  beforeEach(async function () {
    this.contract = await WhitelisteeRoleMock.new({ from: whitelister });
    await this.contract.addWhitelistee(whitelistee, { from: whitelister });
    await this.contract.addWhitelistee(otherWhitelistee, { from: whitelister });
  });

  shouldBehaveLikePublicRole(whitelistee, otherWhitelistee, otherAccounts, 'whitelistee', whitelister);
});
