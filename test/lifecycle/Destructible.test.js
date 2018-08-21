const DestructibleMock = artifacts.require('DestructibleMock');
const { ethGetBalance } = require('../helpers/web3');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

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
    newBalance.should.be.bignumber.gt(initBalance);
  });

  it('should send balance to recepient after destruction', async function () {
    const initBalance = await ethGetBalance(recipient);
    await this.destructible.destroyAndSend(recipient, { from: owner });
    const newBalance = await ethGetBalance(recipient);
    newBalance.should.be.bignumber.gt(initBalance);
  });
});
