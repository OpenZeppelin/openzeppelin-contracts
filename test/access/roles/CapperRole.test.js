const { shouldBehaveLikePublicRole } = require('../../access/roles/PublicRole.behavior');
const CapperRoleMock = artifacts.require('CapperRoleMock');

contract('CapperRole', function ([_, capper, otherCapper, ...otherAccounts]) {
  beforeEach(async function () {
    this.contract = await CapperRoleMock.new({ from: capper });
    await this.contract.addCapper(otherCapper, { from: capper });
  });

  shouldBehaveLikePublicRole(capper, otherCapper, otherAccounts, 'capper');
});
