const { shouldBehaveLikeStandardToken } = require('./behaviors/StandardToken.behavior');

const ERC20 = artifacts.require('ERC20Mock');

contract('ERC20', function ([_, owner, recipient, anotherAccount]) {
  beforeEach(async function () {
    this.token = await ERC20.new(owner, 100);
  });

  shouldBehaveLikeStandardToken([owner, recipient, anotherAccount]);
});
