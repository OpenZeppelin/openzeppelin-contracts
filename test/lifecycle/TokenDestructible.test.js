const { ethGetBalance } = require('../helpers/web3');

const TokenDestructible = artifacts.require('TokenDestructible');
const StandardTokenMock = artifacts.require('StandardTokenMock');

contract('TokenDestructible', function (accounts) {
  let tokenDestructible;
  let owner;

  beforeEach(async function () {
    tokenDestructible = await TokenDestructible.new({
      from: accounts[0],
      value: web3.toWei('10', 'ether'),
    });

    owner = await tokenDestructible.owner();
  });

  it('should send balance to owner after destruction', async function () {
    const initBalance = await ethGetBalance(owner);
    await tokenDestructible.destroy([], { from: owner });

    const newBalance = await ethGetBalance(owner);
    assert.isTrue(newBalance > initBalance);
  });

  it('should send tokens to owner after destruction', async function () {
    const token = await StandardTokenMock.new(tokenDestructible.address, 100);
    const initContractBalance = await token.balanceOf(tokenDestructible.address);
    const initOwnerBalance = await token.balanceOf(owner);
    assert.equal(initContractBalance, 100);
    assert.equal(initOwnerBalance, 0);

    await tokenDestructible.destroy([token.address], { from: owner });
    const newContractBalance = await token.balanceOf(tokenDestructible.address);
    const newOwnerBalance = await token.balanceOf(owner);
    assert.equal(newContractBalance, 0);
    assert.equal(newOwnerBalance, 100);
  });
});
