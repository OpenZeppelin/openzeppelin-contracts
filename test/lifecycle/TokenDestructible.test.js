const { ethGetBalance } = require('../helpers/web3');

const TokenDestructible = artifacts.require('TokenDestructible');
const StandardTokenMock = artifacts.require('StandardTokenMock');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('TokenDestructible', function ([_, owner]) {
  let tokenDestructible;

  beforeEach(async function () {
    tokenDestructible = await TokenDestructible.new({
      from: owner,
      value: web3.toWei('10', 'ether'),
    });
  });

  it('should send balance to owner after destruction', async function () {
    const initBalance = await ethGetBalance(owner);
    await tokenDestructible.destroy([], { from: owner });

    const newBalance = await ethGetBalance(owner);
    newBalance.should.be.bignumber.gt(initBalance);
  });

  it('should send tokens to owner after destruction', async function () {
    const token = await StandardTokenMock.new(tokenDestructible.address, 100);
    (await token.balanceOf(tokenDestructible.address)).should.be.bignumber.equal(100);
    (await token.balanceOf(owner)).should.be.bignumber.equal(0);

    await tokenDestructible.destroy([token.address], { from: owner });
    (await token.balanceOf(tokenDestructible.address)).should.be.bignumber.equal(0);
    (await token.balanceOf(owner)).should.be.bignumber.equal(100);
  });
});
