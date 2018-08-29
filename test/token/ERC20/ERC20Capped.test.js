const { assertRevert } = require('../../helpers/assertRevert');
const { ether } = require('../../helpers/ether');
const { shouldBehaveLikeERC20Mintable } = require('./ERC20Mintable.behavior');
const { shouldBehaveLikeERC20Capped } = require('./ERC20Capped.behavior');

const ERC20Capped = artifacts.require('ERC20Capped');

contract('ERC20Capped', function ([_, owner, ...otherAccounts]) {
  const cap = ether(1000);

  it('requires a non-zero cap', async function () {
    await assertRevert(
      ERC20Capped.new(0, { from: owner })
    );
  });

  context('once deployed', async function () {
    beforeEach(async function () {
      this.token = await ERC20Capped.new(cap, { from: owner });
    });

    shouldBehaveLikeERC20Capped(owner, otherAccounts, cap);
    shouldBehaveLikeERC20Mintable(owner, owner, otherAccounts);
  });
});
