const { BN } = require('@openzeppelin/test-helpers');

const { shouldBehaveLikeERC20Burnable } = require('./ERC20Burnable.behavior');
const ERC20Burnable = artifacts.require('$ERC20Burnable');

contract('ERC20Burnable', function (accounts) {
  const [owner, ...otherAccounts] = accounts;

  const initialBalance = new BN(1000);

  const name = 'My Token';
  const symbol = 'MTKN';

  beforeEach(async function () {
    this.token = await ERC20Burnable.new(name, symbol, { from: owner });
    await this.token.$_mint(owner, initialBalance);
  });

  shouldBehaveLikeERC20Burnable(owner, initialBalance, otherAccounts);
});
