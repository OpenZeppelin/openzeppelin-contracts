const { accounts, contract } = require('@openzeppelin/test-environment');

const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');
const MinterRoleMock = contract.fromArtifact('MinterRoleMock');

describe('MinterRole', function () {
  const [ minter, otherMinter, ...otherAccounts ] = accounts;

  beforeEach(async function () {
    this.contract = await MinterRoleMock.new({ from: minter });
    await this.contract.addMinter(otherMinter, { from: minter });
  });

  shouldBehaveLikePublicRole(minter, otherMinter, otherAccounts, 'minter');
});
