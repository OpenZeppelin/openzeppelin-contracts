const { shouldBehaveLikeMintableToken } = require('./MintableToken.behavior');
const MintableToken = artifacts.require('MintableToken');

contract('MintableToken', function ([_, owner, ...otherAccounts]) {
  beforeEach(async function () {
    this.token = await MintableToken.new({ from: owner });
  });

  shouldBehaveLikeMintableToken(owner, owner, otherAccounts);
});
