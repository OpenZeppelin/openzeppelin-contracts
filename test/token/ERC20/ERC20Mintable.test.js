const { shouldBehaveLikeERC20Mintable } = require('./ERC20Mintable.behavior');
const ERC20Mintable = artifacts.require('ERC20Mintable');

contract('ERC20Mintable', function ([_, minter, ...otherAccounts]) {
  beforeEach(async function () {
    this.token = await ERC20Mintable.new({ from: minter });
  });

  shouldBehaveLikeERC20Mintable(minter, otherAccounts);
});
