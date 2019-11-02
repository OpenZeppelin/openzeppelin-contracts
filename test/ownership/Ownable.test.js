require('@openzeppelin/test-helpers');
const { shouldBehaveLikeOwnable } = require('./Ownable.behavior');

const Ownable = load.truffle('OwnableMock');

describe('Ownable', function ([_, owner, ...otherAccounts]) {
  beforeEach(async function () {
    this.ownable = await Ownable.new({ from: owner });
  });

  shouldBehaveLikeOwnable(owner, otherAccounts);
});
