const { ether } = require('../../helpers/ether');
const { shouldBehaveLikeRBACMintableToken } = require('./RBACMintableToken.behaviour');
const { shouldBehaveLikeMintableToken } = require('./MintableToken.behaviour');
const { shouldBehaveLikeCappedToken } = require('./CappedToken.behaviour');

const RBACCappedTokenMock = artifacts.require('RBACCappedTokenMock');

contract('RBACCappedToken', function ([_, owner, minter, ...otherAccounts]) {
  const cap = ether(1000);

  beforeEach(async function () {
    this.token = await RBACCappedTokenMock.new(cap, { from: owner });
    await this.token.addMinter(minter, { from: owner });
  });

  shouldBehaveLikeMintableToken(owner, minter, otherAccounts);
  shouldBehaveLikeRBACMintableToken(owner, otherAccounts);
  shouldBehaveLikeCappedToken(minter, otherAccounts, cap);
});
