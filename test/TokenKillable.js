'use strict';

var TokenKillable = artifacts.require('../contracts/lifecycle/TokenKillable.sol');
var StandardTokenMock = artifacts.require("./helpers/StandardTokenMock.sol");
require('./helpers/transactionMined.js');

contract('TokenKillable', function(accounts) {

  it('should send balance to owner after death', async function() {
    let killable = await TokenKillable.new({from: accounts[0], value: web3.toWei('10','ether')});
    let owner = await killable.owner();
    let initBalance = web3.eth.getBalance(owner);
    await killable.kill([], {from: owner});
    let newBalance = web3.eth.getBalance(owner);
    assert.isTrue(newBalance > initBalance);
  });

  it('should send tokens to owner after death', async function() {
    let killable = await TokenKillable.new({from: accounts[0], value: web3.toWei('10','ether')});
    let owner = await killable.owner();
    let token = await StandardTokenMock.new(killable.address, 100);
    let initContractBalance = await token.balanceOf(killable.address);
    let initOwnerBalance = await token.balanceOf(owner);
    assert.equal(initContractBalance, 100);
    assert.equal(initOwnerBalance, 0);
    await killable.kill([token.address], {from: owner});
    let newContractBalance = await token.balanceOf(killable.address);
    let newOwnerBalance = await token.balanceOf(owner);
    assert.equal(newContractBalance, 0);
    assert.equal(newOwnerBalance, 100);
  });
});
