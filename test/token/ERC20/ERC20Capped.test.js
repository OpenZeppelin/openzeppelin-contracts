const { BN, ether, shouldFail } = require('openzeppelin-test-helpers');
const { shouldBehaveLikeERC20Mintable } = require('./behaviors/ERC20Mintable.behavior');
const { shouldBehaveLikeERC20Capped } = require('./behaviors/ERC20Capped.behavior');

const ERC20Capped = artifacts.require('ERC20Capped');

contract('ERC20Capped', function ([_, minter, ...otherAccounts]) {
  const cap = ether('1000');

  it('requires a non-zero cap', async function () {
    await shouldFail.reverting.withMessage(
      ERC20Capped.new(new BN(0), { from: minter }), 'ERC20Capped: cap is 0'
    );
  });

  context('once deployed', async function () {
    beforeEach(async function () {
      this.token = await ERC20Capped.new(cap, { from: minter });
    });

    shouldBehaveLikeERC20Capped(minter, otherAccounts, cap);
    shouldBehaveLikeERC20Mintable(minter, otherAccounts);
  });
});
