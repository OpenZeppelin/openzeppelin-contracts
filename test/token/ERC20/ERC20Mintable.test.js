const { accounts, load } = require('@openzeppelin/test-env');
const [ minter, otherMinter, ...otherAccounts ] = accounts;

const { shouldBehaveLikeERC20Mintable } = require('./behaviors/ERC20Mintable.behavior');
const ERC20MintableMock = load.truffle.fromArtifacts('ERC20MintableMock');
const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');

describe('ERC20Mintable', function () {
  beforeEach(async function () {
    this.token = await ERC20MintableMock.new({ from: minter });
  });

  describe('minter role', function () {
    beforeEach(async function () {
      this.contract = this.token;
      await this.contract.addMinter(otherMinter, { from: minter });
    });

    shouldBehaveLikePublicRole(minter, otherMinter, otherAccounts, 'minter');
  });

  shouldBehaveLikeERC20Mintable(minter, otherAccounts);
});
