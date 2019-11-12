const { accounts, load } = require('@openzeppelin/test-env');
const [ pauser, otherPauser, ...otherAccounts ] = accounts;

const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');
const PauserRoleMock = load.truffle.fromArtifacts('PauserRoleMock');

describe('PauserRole', function () {
  beforeEach(async function () {
    this.contract = await PauserRoleMock.new({ from: pauser });
    await this.contract.addPauser(otherPauser, { from: pauser });
  });

  shouldBehaveLikePublicRole(pauser, otherPauser, otherAccounts, 'pauser');
});
