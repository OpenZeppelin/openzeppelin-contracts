const { shouldBehaveLikeMintableToken } = require('./MintableToken.behavior');
const MintableToken = artifacts.require('MintableToken');

contract('MintableToken', function ([_, minter, ...otherAccounts]) {
  beforeEach(async function () {
    this.token = await MintableToken.new([minter]);
  });

  shouldBehaveLikeMintableToken(minter, otherAccounts);
});
