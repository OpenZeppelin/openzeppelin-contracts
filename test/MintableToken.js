'use strict';

const assertJump = require('./helpers/assertJump');
var MintableToken = artifacts.require('../contracts/Tokens/MintableToken.sol');

contract('Mintable', function(accounts) {
  let token;

  beforeEach(async function() {
    token = await MintableToken.new();
  });

  it('should start with a totalSupply of 0', async function() {
    let totalSupply = await token.totalSupply();

    assert.equal(totalSupply, 0);
  });

  it('should return mintingFinished false after construction', async function() {
    let mintingFinished = await token.mintingFinished();

    assert.equal(mintingFinished, false);
  });

  it('should mint a given amount of tokens to a given address', async function() {
    await token.mint(accounts[0], 100);
    
    let balance0 = await token.balanceOf(accounts[0]);
    assert(balance0, 100);
    
    let totalSupply = await token.totalSupply();
    assert(totalSupply, 100);
  })

});
