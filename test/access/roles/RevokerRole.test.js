const { accounts, contract } = require('@openzeppelin/test-environment');

const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');
const RevokerRoleMock = contract.fromArtifact('RevokerRoleMock');

describe('RevokerRole', function () {
  const [ revoker, otherRevoker, ...otherAccounts ] = accounts;

  beforeEach(async function () {
    this.contract = await RevokerRoleMock.new({ from: revoker });
    await this.contract.addRevoker(otherRevoker, { from: revoker });
  });

  shouldBehaveLikePublicRole(revoker, otherRevoker, otherAccounts, 'revoker');
});
