'use strict';

const assertRevert = require('./helpers/assertRevert');
const expectThrow = require('./helpers/expectThrow');
var StandardTokenMock = artifacts.require('./helpers/StandardTokenMock.sol');

contract('StandardToken', function(accounts) {

  let token;

  beforeEach(async function() {
    token = await StandardTokenMock.new(accounts[0], 100);
  });

  it('should return the correct totalSupply after construction', async function() {
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
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
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
    await token.approve(accounts[1], 99);
    try {
      await token.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should throw an error when trying to transferFrom more than _from has', async function() {
    let balance0 = await token.balanceOf(accounts[0]);
    await token.approve(accounts[1], 99);
    try {
      await token.transferFrom(accounts[0], accounts[2], balance0+1, {from: accounts[1]});
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  describe('validating allowance updates to spender', function() {
    let preApproved;

    it('should start with zero', async function() {
      preApproved = await token.allowance(accounts[0], accounts[1]);
      assert.equal(preApproved, 0);
    })

    it('should increase by 50 then decrease by 10', async function() {
      await token.increaseApproval(accounts[1], 50);
      let postIncrease = await token.allowance(accounts[0], accounts[1]);
      preApproved.plus(50).should.be.bignumber.equal(postIncrease);
      await token.decreaseApproval(accounts[1], 10);
      let postDecrease = await token.allowance(accounts[0], accounts[1]);
      postIncrease.minus(10).should.be.bignumber.equal(postDecrease);
    })
  });

  it('should increase by 50 then set to 0 when decreasing by more than 50', async function() {
    await token.approve(accounts[1], 50);
    await token.decreaseApproval(accounts[1], 60);
    let postDecrease = await token.allowance(accounts[0], accounts[1]);
    postDecrease.should.be.bignumber.equal(0);
});

  it('should throw an error when trying to transfer to 0x0', async function() {
    let token = await StandardTokenMock.new(accounts[0], 100);
    try {
      let transfer = await token.transfer(0x0, 100);
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should throw an error when trying to transferFrom to 0x0', async function() {
    let token = await StandardTokenMock.new(accounts[0], 100);
    await token.approve(accounts[1], 100);
    try {
      let transfer = await token.transferFrom(accounts[0], 0x0, 100, {from: accounts[1]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

});
