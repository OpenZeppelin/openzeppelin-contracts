'use strict';
import expectThrow from './helpers/expectThrow';
import toPromise from './helpers/toPromise';
const HasNoTokens = artifacts.require('../contracts/lifecycle/HasNoTokens.sol');
const ERC23TokenMock = artifacts.require('./helpers/ERC23TokenMock.sol');

contract('HasNoTokens', function(accounts) {
  let hasNoTokens = null;
  let token = null;

  beforeEach(async () => {
    // Create contract and token
    hasNoTokens = await HasNoTokens.new();
    token = await ERC23TokenMock.new(accounts[0], 100);

    // Force token into contract
    await token.transfer(hasNoTokens.address, 10);
    const startBalance = await token.balanceOf(hasNoTokens.address);
    assert.equal(startBalance, 10);
  });

  it('should not accept ERC23 tokens', async function() {
    await expectThrow(token.transferERC23(hasNoTokens.address, 10, ''));
  });

  it('should allow owner to reclaim tokens', async function() {
    const ownerStartBalance = await token.balanceOf(accounts[0]);
    await hasNoTokens.reclaimToken(token.address);
    const ownerFinalBalance = await token.balanceOf(accounts[0]);
    const finalBalance = await token.balanceOf(hasNoTokens.address);
    assert.equal(finalBalance, 0);
    assert.equal(ownerFinalBalance - ownerStartBalance, 10);
  });

  it('should allow only owner to reclaim tokens', async function() {
    await expectThrow(
      hasNoTokens.reclaimToken(token.address, {from: accounts[1]}),
    );
  });
});
