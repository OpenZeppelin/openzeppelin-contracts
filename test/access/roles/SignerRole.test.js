const { shouldBehaveLikePublicRole } = require('../../access/roles/PublicRole.behavior');
const SignerRoleMock = artifacts.require('SignerRoleMock');
const expectEvent = require('../../helpers/expectEvent');

contract('SignerRole', function ([_, signer, otherSigner, ...otherAccounts]) {
  beforeEach(async function () {
    this.contract = await SignerRoleMock.new({ from: signer });
    await expectEvent.inConstruction(this.contract, 'SignerAdded', {
      account: signer,
    });

    await this.contract.addSigner(otherSigner, { from: signer });
  });

  shouldBehaveLikePublicRole(signer, otherSigner, otherAccounts, 'signer');
});
