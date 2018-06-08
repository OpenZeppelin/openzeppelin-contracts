import ether from '../../helpers/ether';
import shouldBehaveLikeRBACMintableToken from './RBACMintableToken.behaviour';
import shouldBehaveLikeMintableToken from './MintableToken.behaviour';
import shouldBehaveLikeCappedToken from './CappedToken.behaviour';

const RBACCappedTokenMock = artifacts.require('RBACCappedTokenMock');

contract('RBACCappedToken', function ([owner, anotherAccount, minter]) {
  const _cap = ether(1000);

  beforeEach(async function () {
    this.token = await RBACCappedTokenMock.new(_cap, { from: owner });
    await this.token.addMinter(minter, { from: owner });
  });

  shouldBehaveLikeMintableToken([owner, anotherAccount, minter]);
  shouldBehaveLikeRBACMintableToken([owner, anotherAccount]);
  shouldBehaveLikeCappedToken([owner, anotherAccount, minter, _cap]);
});
