const { shouldBehaveLikeEscrow } = require('./Escrow.behaviour');

const Escrow = artifacts.require('Escrow');

contract('Escrow', function (accounts) {
  const owner = accounts[0];

  beforeEach(async function () {
    this.escrow = await Escrow.new({ from: owner });
  });

  shouldBehaveLikeEscrow(owner, accounts.slice(1));
});
