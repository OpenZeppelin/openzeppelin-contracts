const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');
const { shouldBehaveLikeERC20Capped } = require('./ERC20Capped.behavior');

const ERC20Capped = artifacts.require('ERC20CappedMock');

contract('ERC20Capped', function (accounts) {
  const [ minter, ...otherAccounts ] = accounts;

  const cap = ether('1000');

  const name = 'My Token';
  const symbol = 'MTKN';

  it('requires a non-zero cap', async function () {
    await expectRevert(
      ERC20Capped.new(name, symbol, new BN(0), { from: minter }), 'ERC20Capped: cap is 0',
    );
  });

  context('once deployed', async function () {
    beforeEach(async function () {
      this.token = await ERC20Capped.new(name, symbol, cap, { from: minter });
    });

    shouldBehaveLikeERC20Capped(minter, otherAccounts, cap);
  });
});
