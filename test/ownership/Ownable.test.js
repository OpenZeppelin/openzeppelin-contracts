const shouldFail = require('../helpers/shouldFail');

require('../helpers/setup');

const { shouldBehaveLikeOwnable } = require('./Ownable.behavior');

const Ownable = artifacts.require('OwnableMock');

contract('Ownable', function ([_, owner, anyone, ...otherAccounts]) {
  beforeEach(async function () {
    this.ownable = await Ownable.new({ from: owner });
  });

  it('cannot be reinitialized', async function () {
    await shouldFail.reverting(this.ownable.initialize(anyone));
  });

  shouldBehaveLikeOwnable(owner, otherAccounts);
});
