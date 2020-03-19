const { accounts, contract } = require('@openzeppelin/test-environment');

require('@openzeppelin/test-helpers');
const { shouldBehaveLikeEscrow } = require('./Escrow.behavior');

const Escrow = contract.fromArtifact('Escrow');

describe('Escrow', function () {
  const [ owner, ...otherAccounts ] = accounts;

  beforeEach(async function () {
    this.escrow = await Escrow.new({ from: owner });
  });

  shouldBehaveLikeEscrow(owner, otherAccounts);
});
