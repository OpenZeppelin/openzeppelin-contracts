const { accounts, contract } = require('@openzeppelin/test-environment');

const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');
const WhitelistedRoleMock = contract.fromArtifact('WhitelistedRoleMock');

describe('WhitelistedRole', function () {
  const [ whitelisted, otherWhitelisted, whitelistAdmin, ...otherAccounts ] = accounts;

  beforeEach(async function () {
    this.contract = await WhitelistedRoleMock.new({ from: whitelistAdmin });
    await this.contract.addWhitelisted(whitelisted, { from: whitelistAdmin });
    await this.contract.addWhitelisted(otherWhitelisted, { from: whitelistAdmin });
  });

  shouldBehaveLikePublicRole(whitelisted, otherWhitelisted, otherAccounts, 'whitelisted', whitelistAdmin);
});
