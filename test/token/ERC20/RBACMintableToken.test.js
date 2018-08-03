const { shouldBehaveLikeRBACMintableToken } = require('./RBACMintableToken.behavior');
const { shouldBehaveLikeMintableToken } = require('./MintableToken.behavior');

const RBACMintableToken = artifacts.require('RBACMintableToken');

contract('RBACMintableToken', function ([_, owner, minter, ...otherAccounts]) {
  beforeEach(async function () {
    this.token = await RBACMintableToken.new({ from: owner });
    await this.token.addMinter(minter, { from: owner });
  });

  shouldBehaveLikeRBACMintableToken(owner, otherAccounts);
  shouldBehaveLikeMintableToken(owner, minter, otherAccounts);
});
