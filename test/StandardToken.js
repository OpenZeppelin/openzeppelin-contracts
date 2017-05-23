'use strict';

const assertJump = require('./helpers/assertJump');
var StandardTokenMock = artifacts.require('./helpers/StandardTokenMock.sol');

contract('StandardToken', function(accounts) {

  it('should return the correct totalSupply after construction', async function() {
    let token = await StandardTokenMock.new(accounts[0], 100);
    let totalSupply = await token.totalSupply();

    assert.equal(totalSupply, 100);
  });

  it('should return the correct allowance amount after approval', async function() {
    let token = await StandardTokenMock.new();
    await token.approve(accounts[1], 100);
    let allowance = await token.allowance(accounts[0], accounts[1]);

    assert.equal(allowance, 100);
  });

  it('should return correct balances after transfer', async function() {
    let token = await StandardTokenMock.new(accounts[0], 100);
    await token.transfer(accounts[1], 100);
    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[1]);
    assert.equal(balance1, 100);
  });

  it('should throw an error when trying to transfer more than balance', async function() {
    let token = await StandardTokenMock.new(accounts[0], 100);
    try {
      await token.transfer(accounts[1], 101);
    } catch(error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');
  });

  it('should return correct balances after transfering from another account', async function() {
    let token = await StandardTokenMock.new(accounts[0], 100);
    await token.approve(accounts[1], 100);
    await token.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[2]);
    assert.equal(balance1, 100);

    let balance2 = await token.balanceOf(accounts[1]);
    assert.equal(balance2, 0);
  });

  it('should throw an error when trying to transfer more than allowed', async function() {
    let token = await StandardTokenMock.new();
    await token.approve(accounts[1], 99);
    try {
      await token.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});
    } catch (error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');
  });

});
