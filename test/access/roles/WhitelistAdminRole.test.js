const { accounts, contract } = require('@openzeppelin/test-environment');

const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');
const WhitelistAdminRoleMock = contract.fromArtifact('WhitelistAdminRoleMock');

describe('WhitelistAdminRole', function () {
  const [ whitelistAdmin, otherWhitelistAdmin, ...otherAccounts ] = accounts;

  beforeEach(async function () {
    this.contract = await WhitelistAdminRoleMock.new({ from: whitelistAdmin });
    await this.contract.addWhitelistAdmin(otherWhitelistAdmin, { from: whitelistAdmin });
  });

  shouldBehaveLikePublicRole(whitelistAdmin, otherWhitelistAdmin, otherAccounts, 'whitelistAdmin');
});
