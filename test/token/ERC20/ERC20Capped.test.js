const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');
const { shouldBehaveLikeERC20Capped } = require('./behaviors/ERC20Capped.behavior');

const ERC20Capped = contract.fromArtifact('ERC20CappedMock');

describe('ERC20Capped', function () {
  const [ minter, ...otherAccounts ] = accounts;

  const cap = ether('1000');

  const name = 'My Token';
  const symbol = 'MTKN';
  const decimals = new BN(18);

  it('requires a non-zero cap', async function () {
    await expectRevert(
      ERC20Capped.new(name, symbol, decimals, new BN(0), { from: minter }), 'ERC20Capped: cap is 0'
    );
  });

  context('once deployed', async function () {
    beforeEach(async function () {
      this.token = await ERC20Capped.new(name, symbol, decimals, cap, { from: minter });
    });

    shouldBehaveLikeERC20Capped(minter, otherAccounts, cap);
  });
});
