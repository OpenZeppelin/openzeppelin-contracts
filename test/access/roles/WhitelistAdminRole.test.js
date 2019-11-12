const { accounts, load } = require('@openzeppelin/test-env');
const [ whitelistAdmin, otherWhitelistAdmin, ...otherAccounts ] = accounts;

const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');
const WhitelistAdminRoleMock = load.truffle.fromArtifacts('WhitelistAdminRoleMock');

describe('WhitelistAdminRole', function () {
  beforeEach(async function () {
    this.contract = await WhitelistAdminRoleMock.new({ from: whitelistAdmin });
    await this.contract.addWhitelistAdmin(otherWhitelistAdmin, { from: whitelistAdmin });
  });

  shouldBehaveLikePublicRole(whitelistAdmin, otherWhitelistAdmin, otherAccounts, 'whitelistAdmin');
});
