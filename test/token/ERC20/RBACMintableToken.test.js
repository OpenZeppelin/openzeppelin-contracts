import shouldBehaveLikeRBACMintableToken from './RBACMintableToken.behaviour';
import shouldBehaveLikeMintableToken from './MintableToken.behaviour';

const RBACMintableToken = artifacts.require('RBACMintableToken');

contract('RBACMintableToken', function ([owner, anotherAccount, minter]) {
  beforeEach(async function () {
    this.token = await RBACMintableToken.new({ from: owner });
    await this.token.addMinter(minter, { from: owner });
  });

  shouldBehaveLikeRBACMintableToken([owner, anotherAccount, minter]);
  shouldBehaveLikeMintableToken([owner, anotherAccount, minter]);
});
