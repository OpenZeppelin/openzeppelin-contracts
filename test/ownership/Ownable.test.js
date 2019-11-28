const { accounts, contract } = require('@openzeppelin/test-environment');

require('@openzeppelin/test-helpers');
const { shouldBehaveLikeOwnable } = require('./Ownable.behavior');

const Ownable = contract.fromArtifact('OwnableMock');

describe('Ownable', function () {
  const [ owner, ...otherAccounts ] = accounts;

  beforeEach(async function () {
    this.ownable = await Ownable.new({ from: owner });
  });

  shouldBehaveLikeOwnable(owner, otherAccounts);
});
