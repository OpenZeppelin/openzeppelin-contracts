const { accounts, load } = require('@openzeppelin/test-env');
const [ minter, otherMinter, ...otherAccounts ] = accounts;

const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');
const MinterRoleMock = load.truffle.fromArtifacts('MinterRoleMock');

describe('MinterRole', function () {
  beforeEach(async function () {
    this.contract = await MinterRoleMock.new({ from: minter });
    await this.contract.addMinter(otherMinter, { from: minter });
  });

  shouldBehaveLikePublicRole(minter, otherMinter, otherAccounts, 'minter');
});
