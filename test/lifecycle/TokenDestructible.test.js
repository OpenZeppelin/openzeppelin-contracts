
var TokenDestructible = artifacts.require('TokenDestructible');
var StandardTokenMock = artifacts.require('StandardTokenMock');
require('../helpers/transactionMined.js');

contract('TokenDestructible', function (accounts) {
  let destructible;

  beforeEach(async function () {
    destructible = await TokenDestructible.new({
      from: accounts[0],
      value: web3.toWei('10', 'ether'),
    });
  });

  it('should send balance to owner after destruction', async function () {
    let owner = await destructible.owner();
    let initBalance = web3.eth.getBalance(owner);
    await destructible.destroy([], { from: owner });
    let newBalance = web3.eth.getBalance(owner);
    assert.isTrue(newBalance > initBalance);
  });

  it('should send tokens to owner after destruction', async function () {
    let owner = await destructible.owner();
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
