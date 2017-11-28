'use strict';

import expectThrow from './helpers/expectThrow';
import ether from './helpers/ether';
var CappedToken = artifacts.require('../contracts/Tokens/CappedToken.sol');

const BigNumber = web3.BigNumber

contract('Capped', function(accounts) {
  const cap = ether(1000);

  let token;

  beforeEach(async function() {
    token = await CappedToken.new(cap);
  })

  it('should start with the correct cap', async function() {
    let _cap = await token.cap();

    assert(cap.eq(_cap));
  })

  it('should mint when amount is less than cap', async function() {
    const result = await token.mint(accounts[0], 100);
    assert.equal(result.logs[0].event, 'Mint');
  })

  it('should fail to mint if the ammount exceeds the cap', async function() {
    await token.mint(accounts[0], cap.sub(1));
    await expectThrow(token.mint(accounts[0], 100));
  })

  it('should fail to mint after cap is reached', async function() {
    await token.mint(accounts[0], cap);
    await expectThrow(token.mint(accounts[0], 1));
  })

});
