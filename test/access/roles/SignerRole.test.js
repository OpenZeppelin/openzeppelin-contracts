const { accounts, load } = require('@openzeppelin/test-env');
const [ signer, otherSigner, ...otherAccounts ] = accounts;

const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');
const SignerRoleMock = load.truffle('SignerRoleMock');

describe('SignerRole', function () {
  beforeEach(async function () {
    this.contract = await SignerRoleMock.new({ from: signer });
    await this.contract.addSigner(otherSigner, { from: signer });
  });

  shouldBehaveLikePublicRole(signer, otherSigner, otherAccounts, 'signer');
});
