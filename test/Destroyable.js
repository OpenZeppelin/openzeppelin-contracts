'use strict';

var Destroyable = artifacts.require('../contracts/lifecycle/Destroyable.sol');
require('./helpers/transactionMined.js');

contract('Destroyable', function(accounts) {

  it('should send balance to owner after destruction', async function() {
    let destroyable = await Destroyable.new({from: accounts[0], value: web3.toWei('10','ether')});
    let owner = await destroyable.owner();
    let initBalance = web3.eth.getBalance(owner);
    await destroyable.destroy({from: owner});
    let newBalance = web3.eth.getBalance(owner);

    assert.isTrue(newBalance > initBalance);
  });

});
