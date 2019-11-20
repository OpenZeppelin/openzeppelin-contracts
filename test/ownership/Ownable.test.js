const { accounts, contract } = require('@openzeppelin/test-environment');
const [ owner, ...otherAccounts ] = accounts;

require('@openzeppelin/test-helpers');
const { shouldBehaveLikeOwnable } = require('./Ownable.behavior');

const Ownable = contract.fromArtifact('OwnableMock');

describe('Ownable', function () {
  beforeEach(async function () {
    this.ownable = await Ownable.new({ from: owner });
  });

  shouldBehaveLikeOwnable(owner, otherAccounts);
});
