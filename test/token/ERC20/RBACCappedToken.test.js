const { ether } = require('../../helpers/ether');
const { shouldBehaveLikeRBACMintableToken } = require('./RBACMintableToken.behaviour');
const { shouldBehaveLikeMintableToken } = require('./MintableToken.behaviour');
const { shouldBehaveLikeCappedToken } = require('./CappedToken.behaviour');

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
