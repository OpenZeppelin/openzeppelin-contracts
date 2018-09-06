const { shouldBehaveLikeERC20Mintable } = require('./ERC20Mintable.behavior');
const ERC20Mintable = artifacts.require('ERC20Mintable');

contract('ERC20Mintable', function ([_, owner, ...otherAccounts]) {
  beforeEach(async function () {
    this.token = await ERC20Mintable.new({ from: owner });
  });

  shouldBehaveLikeERC20Mintable(owner, owner, otherAccounts);
});
