import { ethGetBalance } from '../helpers/web3';

const Destructible = artifacts.require('Destructible');
require('../helpers/transactionMined.js');

contract('Destructible', function (accounts) {
  it('should send balance to owner after destruction', async function () {
    let destructible = await Destructible.new({ from: accounts[0], value: web3.toWei('10', 'ether') });
    let owner = await destructible.owner();
    let initBalance = await ethGetBalance(owner);
    await destructible.destroy({ from: owner });
    let newBalance = await ethGetBalance(owner);
    assert.isTrue(newBalance > initBalance);
  });

  it('should send balance to recepient after destruction', async function () {
    let destructible = await Destructible.new({ from: accounts[0], value: web3.toWei('10', 'ether') });
    let owner = await destructible.owner();
    let initBalance = await ethGetBalance(accounts[1]);
    await destructible.destroyAndSend(accounts[1], { from: owner });
    let newBalance = await ethGetBalance(accounts[1]);
    assert.isTrue(newBalance.greaterThan(initBalance));
  });
});
