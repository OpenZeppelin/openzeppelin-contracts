const { shouldBehaveLikeOwnable } = require('./Ownable.behavior');

const Ownable = artifacts.require('Ownable');

contract('Ownable', function ([_, owner, ...otherAccounts]) {
  beforeEach(async function () {
    this.ownable = await Ownable.new({ from: owner });
  });

  shouldBehaveLikeOwnable(owner, otherAccounts);
});
