'use strict';

var TokenDestroyable = artifacts.require('../contracts/lifecycle/TokenDestroyable.sol');
var StandardTokenMock = artifacts.require("./helpers/StandardTokenMock.sol");
require('./helpers/transactionMined.js');

contract('TokenDestroyable', function(accounts) {

  it('should send balance to owner after destruction', async function() {
    let destroyable = await TokenDestroyable.new({from: accounts[0], value: web3.toWei('10','ether')});
    let owner = await destroyable.owner();
    let initBalance = web3.eth.getBalance(owner);
    await destroyable.destroy([], {from: owner});
    let newBalance = web3.eth.getBalance(owner);
    assert.isTrue(newBalance > initBalance);
  });

  it('should send tokens to owner after destruction', async function() {
    let destroyable = await TokenDestroyable.new({from: accounts[0], value: web3.toWei('10','ether')});
    let owner = await destroyable.owner();
    let token = await StandardTokenMock.new(destroyable.address, 100);
    let initContractBalance = await token.balanceOf(destroyable.address);
    let initOwnerBalance = await token.balanceOf(owner);
    assert.equal(initContractBalance, 100);
    assert.equal(initOwnerBalance, 0);
    await destroyable.destroy([token.address], {from: owner});
    let newContractBalance = await token.balanceOf(destroyable.address);
    let newOwnerBalance = await token.balanceOf(owner);
    assert.equal(newContractBalance, 0);
    assert.equal(newOwnerBalance, 100);
  });
});
