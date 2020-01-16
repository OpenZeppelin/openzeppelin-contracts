const { accounts, contract } = require('@openzeppelin/test-environment');

const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');
const PauserRoleMock = contract.fromArtifact('PauserRoleMock');

describe('PauserRole', function () {
  const [ pauser, otherPauser, ...otherAccounts ] = accounts;

  beforeEach(async function () {
    this.contract = await PauserRoleMock.new({ from: pauser });
    await this.contract.addPauser(otherPauser, { from: pauser });
  });

  shouldBehaveLikePublicRole(pauser, otherPauser, otherAccounts, 'pauser');
});
