const { shouldBehaveLikeRBACMintableToken } = require('./behaviors/RBACMintableToken.behavior');
const { shouldBehaveLikeERC20Mintable } = require('./behaviors/ERC20Mintable.behavior');

const RBACMintableToken = artifacts.require('RBACMintableToken');

contract('RBACMintableToken', function ([_, owner, minter, ...otherAccounts]) {
  beforeEach(async function () {
    this.token = await RBACMintableToken.new({ from: owner });
    await this.token.addMinter(minter, { from: owner });
  });

  shouldBehaveLikeRBACMintableToken(owner, otherAccounts);
  shouldBehaveLikeERC20Mintable(owner, minter, otherAccounts);
});
