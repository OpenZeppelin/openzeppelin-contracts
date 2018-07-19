const { ethGetBalance } = require('../helpers/web3');

var TokenDestructible = artifacts.require('TokenDestructible');
var StandardTokenMock = artifacts.require('StandardTokenMock');

contract('TokenDestructible', function (accounts) {
  let destructible;
  let owner;

  beforeEach(async function () {
    destructible = await TokenDestructible.new({
      from: accounts[0],
      value: web3.toWei('10', 'ether'),
    });

    owner = await destructible.owner();
  });

  it('should send balance to owner after destruction', async function () {
    let initBalance = await ethGetBalance(owner);
    await destructible.destroy([], { from: owner });
    let newBalance = await ethGetBalance(owner);
    assert.isTrue(newBalance > initBalance);
  });

  it('should send tokens to owner after destruction', async function () {
    let token = await StandardTokenMock.new(destructible.address, 100);
    let initContractBalance = await token.balanceOf(destructible.address);
    let initOwnerBalance = await token.balanceOf(owner);
    assert.equal(initContractBalance, 100);
    assert.equal(initOwnerBalance, 0);
    await destructible.destroy([token.address], { from: owner });
    let newContractBalance = await token.balanceOf(destructible.address);
    let newOwnerBalance = await token.balanceOf(owner);
    assert.equal(newContractBalance, 0);
    assert.equal(newOwnerBalance, 100);
  });
});
