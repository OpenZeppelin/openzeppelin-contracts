'use strict';

var Destructible = artifacts.require('../contracts/lifecycle/Destructible.sol');
require('./helpers/transactionMined.js');

contract('Destructible', function(accounts) {

  it('should send balance to owner after destruction', async function() {
    let destructible = await Destructible.new({from: accounts[0], value: web3.toWei('10','ether')});
    let owner = await destructible.owner();
    let initBalance = web3.eth.getBalance(owner);
    await destructible.destroy({from: owner});
    let newBalance = web3.eth.getBalance(owner);
    assert.isTrue(newBalance > initBalance);
  });

  it('should send balance to recepient after destruction', async function() {
    let destructible = await Destructible.new({from: accounts[0], value: web3.toWei('10','ether')});
    let owner = await destructible.owner();
    let initBalance = web3.eth.getBalance(accounts[1]);
    await destructible.destroyAndSend(accounts[1], {from: owner} );
    let newBalance = web3.eth.getBalance(accounts[1]);
    assert.isTrue(newBalance.greaterThan(initBalance));
  });

});
