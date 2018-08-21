const { assertRevert } = require('./helpers/assertRevert');
const { ethGetBalance } = require('./helpers/web3');

const LimitBalanceMock = artifacts.require('LimitBalanceMock');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('LimitBalance', function () {
  let limitBalance;

  beforeEach(async function () {
    limitBalance = await LimitBalanceMock.new();
  });

  const LIMIT = 1000;

  it('should expose limit', async function () {
    const limit = await limitBalance.limit();
    limit.should.be.bignumber.equal(LIMIT);
  });

  it('should allow sending below limit', async function () {
    const amount = 1;
    await limitBalance.limitedDeposit({ value: amount });

    const balance = await ethGetBalance(limitBalance.address);
    balance.should.be.bignumber.equal(amount);
  });

  it('shouldnt allow sending above limit', async function () {
    const amount = 1110;
    await assertRevert(limitBalance.limitedDeposit({ value: amount }));
  });

  it('should allow multiple sends below limit', async function () {
    const amount = 500;
    await limitBalance.limitedDeposit({ value: amount });

    const balance = await ethGetBalance(limitBalance.address);
    balance.should.be.bignumber.equal(amount);

    await limitBalance.limitedDeposit({ value: amount });
    const updatedBalance = await ethGetBalance(limitBalance.address);
    updatedBalance.should.be.bignumber.equal(amount * 2);
  });

  it('shouldnt allow multiple sends above limit', async function () {
    const amount = 500;
    await limitBalance.limitedDeposit({ value: amount });

    const balance = await ethGetBalance(limitBalance.address);
    balance.should.be.bignumber.equal(amount);
    await assertRevert(limitBalance.limitedDeposit({ value: amount + 1 }));
  });
});
