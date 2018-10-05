const { EVMRevert } = require('../helpers/EVMRevert');
const { expectThrow } = require('../helpers/expectThrow');

const { shouldBehaveLikeOwnable } = require('./Ownable.behavior');

const Ownable = artifacts.require('OwnableMock');

contract('Ownable', function ([_, owner, anyone, ...otherAccounts]) {
  beforeEach(async function () {
    this.ownable = await Ownable.new({ from: owner });
  });

  it('cannot be reinitialized', async function () {
    await expectThrow(this.ownable.initialize(anyone), EVMRevert);
  });

  shouldBehaveLikeOwnable(owner, otherAccounts);
});
