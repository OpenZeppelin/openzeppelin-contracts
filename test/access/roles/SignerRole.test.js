const { accounts, contract } = require('@openzeppelin/test-environment');

const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');
const SignerRoleMock = contract.fromArtifact('SignerRoleMock');

describe('SignerRole', function () {
  const [ signer, otherSigner, ...otherAccounts ] = accounts;

  beforeEach(async function () {
    this.contract = await SignerRoleMock.new({ from: signer });
    await this.contract.addSigner(otherSigner, { from: signer });
  });

  shouldBehaveLikePublicRole(signer, otherSigner, otherAccounts, 'signer');
});
