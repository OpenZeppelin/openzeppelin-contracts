const { shouldBehaveLikeMintableToken } = require('./MintableToken.behavior');
const { shouldBehaveLikePublicRole } = require('../../access/rbac/PublicRole.behavior');
const MintableTokenMock = artifacts.require('MintableTokenMock');

contract('MintableToken', function ([_, originalMinter, otherMinter, ...otherAccounts]) {
  beforeEach(async function () {
    this.token = await MintableTokenMock.new([originalMinter, otherMinter]);
  });

  context('with original minter', function () {
    shouldBehaveLikeMintableToken(originalMinter, otherAccounts);
  });

  describe('minter role', function () {
    beforeEach(async function () {
      await this.token.addMinter(otherMinter);
      this.contract = this.token;
    });

    shouldBehaveLikePublicRole(originalMinter, otherMinter, otherAccounts, 'minter');
  });
});
