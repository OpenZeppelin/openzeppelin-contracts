const {BN} = require('openzeppelin-test-helpers');

const {shouldBehaveLikeERC20Burnable} = require('./behaviors/ERC20Burnable.behavior');
const ERC20BurnableMock = artifacts.require('ERC20BurnableMock');
const {shouldSupportInterfaces} = require('../../introspection/SupportsInterface.behavior');

contract('ERC20Burnable', function ([_, owner, ...otherAccounts]) {
  const initialBalance = new BN(1000);

  beforeEach(async function () {
    this.token = await ERC20BurnableMock.new(owner, initialBalance, {from: owner});
  });

  shouldBehaveLikeERC20Burnable(owner, initialBalance, otherAccounts);

  shouldSupportInterfaces([
    'ERC165',
    'ERC20Burnable'
  ])
});
