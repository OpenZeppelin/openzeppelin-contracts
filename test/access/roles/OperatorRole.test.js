const { shouldBehaveLikePublicRole } = require('../../access/roles/PublicRole.behavior');
const OperatorRoleMock = artifacts.require('OperatorRoleMock');

contract('OperatorRole', function ([_, operator, otherOperator, ...otherAccounts]) {
  beforeEach(async function () {
    this.contract = await OperatorRoleMock.new({ from: operator });
    await this.contract.addOperator(otherOperator, { from: operator });
  });

  shouldBehaveLikePublicRole(operator, otherOperator, otherAccounts, 'operator');
});
