const { shouldBehaveLikePublicRole } = require('../../access/roles/PublicRole.behavior');
const shouldFail = require('../../helpers/shouldFail');
const WhitelisterRoleMock = artifacts.require('WhitelisterRoleMock');

contract('WhitelisterRole', function ([_, whitelister, otherWhitelister, ...otherAccounts]) {
  beforeEach(async function () {
    this.contract = await WhitelisterRoleMock.new({ from: whitelister });
    await this.contract.addWhitelister(otherWhitelister, { from: whitelister });
  });

  shouldBehaveLikePublicRole(whitelister, otherWhitelister, otherAccounts, 'whitelister');

  it('removes role from all other accounts but the whitelister', async function () {
    await this.contract.resetWhitelist({ from: whitelister });
    await shouldFail.reverting(this.contract.onlyWhitelisterMock({ from: otherWhitelister }));
    await this.contract.onlyWhitelisterMock({ from: whitelister });
  });
  it('Transferring ownership should also add to whitelist', async function () {
    const contract = await WhitelisterRoleMock.new({ from: whitelister });
    await contract.transferOwnership(otherWhitelister, { from: whitelister });
    await contract.onlyWhitelisterMock({ from: otherWhitelister });
  });
});
