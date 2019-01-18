const { shouldBehaveLikeEscrow } = require('./Escrow.behavior');

const Escrow = artifacts.require('EscrowMock');

contract('Escrow', function ([_, primary, ...otherAccounts]) {
  beforeEach(async function () {
    this.escrow = await Escrow.new({ from: primary });
  });

  shouldBehaveLikeEscrow(primary, otherAccounts);
});
