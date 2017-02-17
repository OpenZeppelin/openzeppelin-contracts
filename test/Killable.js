'use strict';

var Killable = artifacts.require('../contracts/lifecycle/Killable.sol');
require('./helpers/transactionMined.js');

contract('Killable', function(accounts) {

  it('should send balance to owner after death', async function() {
    let killable = await Killable.new({from: accounts[0], value: web3.toWei('10','ether')});
    let owner = await killable.owner();
    let initBalance = web3.eth.getBalance(owner);
    await killable.kill({from: owner});
    let newBalance = web3.eth.getBalance(owner);

    assert.isTrue(newBalance > initBalance);
  });

});
