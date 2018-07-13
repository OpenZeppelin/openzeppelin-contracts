const { shouldBehaveLikeRBACMintableToken } = require('./RBACMintableToken.behaviour');
const { shouldBehaveLikeMintableToken } = require('./MintableToken.behaviour');

const RBACMintableToken = artifacts.require('RBACMintableToken');

contract('RBACMintableToken', function ([owner, anotherAccount, minter]) {
  beforeEach(async function () {
    this.token = await RBACMintableToken.new({ from: owner });
    await this.token.addMinter(minter, { from: owner });
  });

  shouldBehaveLikeRBACMintableToken([owner, anotherAccount, minter]);
  shouldBehaveLikeMintableToken([owner, anotherAccount, minter]);
});
