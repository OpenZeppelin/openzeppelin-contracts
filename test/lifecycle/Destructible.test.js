const DestructibleMock = artifacts.require('DestructibleMock');
const { ethGetBalance } = require('../helpers/web3');

contract('Destructible', function ([_, owner, recipient]) {
  beforeEach(async function () {
    this.destructible = await DestructibleMock.new({ from: owner });
    await web3.eth.sendTransaction({
      from: owner,
      to: this.destructible.address,
      value: web3.toWei('10', 'ether'),
    });
  });

  it('should send balance to owner after destruction', async function () {
    const initBalance = await ethGetBalance(owner);
    await this.destructible.destroy({ from: owner });
    const newBalance = await ethGetBalance(owner);
    assert.isTrue(newBalance > initBalance);
  });

  it('should send balance to recepient after destruction', async function () {
    const initBalance = await ethGetBalance(recipient);
    await this.destructible.destroyAndSend(recipient, { from: owner });
    const newBalance = await ethGetBalance(recipient);
    assert.isTrue(newBalance.greaterThan(initBalance));
  });
});
