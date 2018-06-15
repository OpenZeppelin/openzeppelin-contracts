import shouldBehaveLikeEscrow from './Escrow.behaviour';

const Escrow = artifacts.require('Escrow');

contract('Escrow', function (accounts) {
  beforeEach(async function () {
    this.contract = await Escrow.new();
  });

  shouldBehaveLikeEscrow(accounts);
});
