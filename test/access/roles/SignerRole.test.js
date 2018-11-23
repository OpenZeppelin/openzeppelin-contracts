const { shouldBehaveLikePublicRole } = require('../../access/roles/PublicRole.behavior');
const SignerRoleMock = artifacts.require('SignerRoleMock');

contract('SignerRole', function ([_, signer, otherSigner, ...otherAccounts]) {
  beforeEach(async function () {
    this.contract = await SignerRoleMock.new({ from: signer });
    await this.contract.addSigner(otherSigner, { from: signer });
  });

  shouldBehaveLikePublicRole(signer, otherSigner, otherAccounts, 'signer');
});
