const { accounts, load } = require('@openzeppelin/test-env');
const [ primary, ...otherAccounts ] = accounts;

require('@openzeppelin/test-helpers');
const { shouldBehaveLikeEscrow } = require('./Escrow.behavior');

const Escrow = load.truffle.fromArtifacts('Escrow');

describe('Escrow', function () {
  beforeEach(async function () {
    this.escrow = await Escrow.new({ from: primary });
  });

  shouldBehaveLikeEscrow(primary, otherAccounts);
});
