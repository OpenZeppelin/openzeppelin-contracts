const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN } = require('@openzeppelin/test-helpers');

const { shouldBehaveLikeERC20Burnable } = require('./behaviors/ERC20Burnable.behavior');
const ERC20BurnableMock = contract.fromArtifact('ERC20BurnableMock');

describe('ERC20Burnable', function () {
  const [ owner, ...otherAccounts ] = accounts;

  const initialBalance = new BN(1000);

  beforeEach(async function () {
    this.token = await ERC20BurnableMock.new(owner, initialBalance, { from: owner });
  });

  shouldBehaveLikeERC20Burnable(owner, initialBalance, otherAccounts);
});
