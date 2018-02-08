
import expectThrow from '../helpers/expectThrow';

const HasNoTokens = artifacts.require('HasNoTokens');
const ERC223TokenMock = artifacts.require('ERC223TokenMock');

contract('HasNoTokens', function (accounts) {
  let hasNoTokens = null;
  let token = null;

  beforeEach(async () => {
    // Create contract and token
    hasNoTokens = await HasNoTokens.new();
    token = await ERC223TokenMock.new(accounts[0], 100);

    // Force token into contract
    await token.transfer(hasNoTokens.address, 10);
    const startBalance = await token.balanceOf(hasNoTokens.address);
    assert.equal(startBalance, 10);
  });

  it('should not accept ERC223 tokens', async function () {
    await expectThrow(token.transferERC223(hasNoTokens.address, 10, ''));
  });

  it('should allow owner to reclaim tokens', async function () {
    const ownerStartBalance = await token.balanceOf(accounts[0]);
    await hasNoTokens.reclaimToken(token.address);
    const ownerFinalBalance = await token.balanceOf(accounts[0]);
    const finalBalance = await token.balanceOf(hasNoTokens.address);
    assert.equal(finalBalance, 0);
    assert.equal(ownerFinalBalance - ownerStartBalance, 10);
  });

  it('should allow only owner to reclaim tokens', async function () {
    await expectThrow(
      hasNoTokens.reclaimToken(token.address, { from: accounts[1] }),
    );
  });
});
