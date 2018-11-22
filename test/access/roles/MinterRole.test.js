const { shouldBehaveLikePublicRole } = require('../../access/roles/PublicRole.behavior');
const MinterRoleMock = artifacts.require('MinterRoleMock');
const expectEvent = require('../../helpers/expectEvent');

contract('MinterRole', function ([_, minter, otherMinter, ...otherAccounts]) {
  beforeEach(async function () {
    this.contract = await MinterRoleMock.new({ from: minter });
    await expectEvent.inConstruction(this.contract, 'MinterAdded', {
      account: minter,
    });

    await this.contract.addMinter(otherMinter, { from: minter });
  });

  shouldBehaveLikePublicRole(minter, otherMinter, otherAccounts, 'minter');
});
