const { accounts, load } = require('@openzeppelin/test-env');
const [ whitelisted, otherWhitelisted, whitelistAdmin, ...otherAccounts ] = accounts;

const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');
const WhitelistedRoleMock = load.truffle.fromArtifacts('WhitelistedRoleMock');

describe('WhitelistedRole', function () {
  beforeEach(async function () {
    this.contract = await WhitelistedRoleMock.new({ from: whitelistAdmin });
    await this.contract.addWhitelisted(whitelisted, { from: whitelistAdmin });
    await this.contract.addWhitelisted(otherWhitelisted, { from: whitelistAdmin });
  });

  shouldBehaveLikePublicRole(whitelisted, otherWhitelisted, otherAccounts, 'whitelisted', whitelistAdmin);
});
