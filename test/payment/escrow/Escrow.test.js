const { accounts, contract } = require('@openzeppelin/test-environment');
const [ primary, ...otherAccounts ] = accounts;

require('@openzeppelin/test-helpers');
const { shouldBehaveLikeEscrow } = require('./Escrow.behavior');

const Escrow = contract.fromArtifact('Escrow');

describe('Escrow', function () {
  beforeEach(async function () {
    this.escrow = await Escrow.new({ from: primary });
  });

  shouldBehaveLikeEscrow(primary, otherAccounts);
});
