const { shouldBehaveLikePublicRole } = require('../../access/roles/PublicRole.behavior');
const PauserRoleMock = artifacts.require('PauserRoleMock');
const expectEvent = require('../../helpers/expectEvent');

contract('PauserRole', function ([_, pauser, otherPauser, ...otherAccounts]) {
  beforeEach(async function () {
    this.contract = await PauserRoleMock.new({ from: pauser });
    await expectEvent.inConstruction(this.contract, 'PauserAdded', {
      account: pauser,
    });

    await this.contract.addPauser(otherPauser, { from: pauser });
  });

  shouldBehaveLikePublicRole(pauser, otherPauser, otherAccounts, 'pauser');
});
