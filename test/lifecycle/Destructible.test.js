var Destructible = artifacts.require('Destructible');
const { ethGetBalance } = require('../helpers/web3');

contract('Destructible', function (accounts) {
  beforeEach(async function () {
    this.destructible = await Destructible.new({ from: accounts[0], value: web3.toWei('10', 'ether') });
    this.owner = await this.destructible.owner();
  });

  it('should send balance to owner after destruction', async function () {
    let initBalance = await ethGetBalance(this.owner);
    await this.destructible.destroy({ from: this.owner });
    let newBalance = await ethGetBalance(this.owner);
    assert.isTrue(newBalance > initBalance);
  });

  it('should send balance to recepient after destruction', async function () {
    let initBalance = await ethGetBalance(accounts[1]);
    await this.destructible.destroyAndSend(accounts[1], { from: this.owner });
    let newBalance = await ethGetBalance(accounts[1]);
    assert.isTrue(newBalance.greaterThan(initBalance));
  });
});
