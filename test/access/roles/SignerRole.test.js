const { accounts, contract } = require('@openzeppelin/test-environment');
const [ signer, otherSigner, ...otherAccounts ] = accounts;

const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');
const SignerRoleMock = contract.fromArtifact('SignerRoleMock');

describe('SignerRole', function () {
  beforeEach(async function () {
    this.contract = await SignerRoleMock.new({ from: signer });
    await this.contract.addSigner(otherSigner, { from: signer });
  });

  shouldBehaveLikePublicRole(signer, otherSigner, otherAccounts, 'signer');
});
