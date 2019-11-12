const { accounts, load } = require('@openzeppelin/test-env');
const [ owner, ...otherAccounts ] = accounts;

require('@openzeppelin/test-helpers');
const { shouldBehaveLikeOwnable } = require('./Ownable.behavior');

const Ownable = load.truffle.fromArtifacts('OwnableMock');

describe('Ownable', function () {
  beforeEach(async function () {
    this.ownable = await Ownable.new({ from: owner });
  });

  shouldBehaveLikeOwnable(owner, otherAccounts);
});
