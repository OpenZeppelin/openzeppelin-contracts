const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');
const { latestTime } = require('../helpers/latestTime');
const { increaseTimeTo, duration } = require('../helpers/increaseTime');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const TimelockedTokenEscrow = artifacts.require('TimelockedTokenEscrow');
const StandardToken = artifacts.require('StandardTokenMock');

contract('TimelockedTokenEscrow', function ([_, owner, payee, ...otherAccounts]) {
  const MAX_UINT256 = new BigNumber(2).pow(256).minus(1);

  beforeEach(async function () {
    this.token = await StandardToken.new(owner, MAX_UINT256);
  });

  it('reverts when release time is in the past', async function () {
    const releaseTime = (await latestTime()) - duration.minutes(1);
    await expectThrow(
      TimelockedTokenEscrow.new(this.token.address, releaseTime, { from: owner }),
      EVMRevert
    );
  });

  context('once deployed', function () {
    const amount = new BigNumber(100);

    beforeEach(async function () {
      this.releaseTime = (await latestTime()) + duration.years(1);
      this.escrow = await TimelockedTokenEscrow.new(
        this.token.address,
        this.releaseTime,
        { from: owner }
      );
      await this.token.approve(this.escrow.address, MAX_UINT256, { from: owner });
      await this.escrow.deposit(payee, amount, { from: owner });
    });

    it('stores the release time', async function () {
      const releaseTime = await this.escrow.releaseTime();
      releaseTime.should.be.bignumber.equal(this.releaseTime);
    });

    it('rejects withdrawals before release time', async function () {
      await expectThrow(this.escrow.withdraw(payee, { from: owner }), EVMRevert);
    });

    it('rejects withdrawals right before release time', async function () {
      await increaseTimeTo(this.releaseTime - duration.seconds(5));
      await expectThrow(this.escrow.withdraw(payee, { from: owner }), EVMRevert);
    });

    it('allows withdrawals right after release time', async function () {
      await increaseTimeTo(this.releaseTime + duration.seconds(5));

      const payeeInitialBalance = await this.token.balanceOf(payee);

      await this.escrow.withdraw(payee, { from: owner });

      const payeeFinalBalance = await this.token.balanceOf(payee);
      payeeFinalBalance.sub(payeeInitialBalance).should.be.bignumber.equal(amount);
    });

    it('allows withdrawals after release time', async function () {
      await increaseTimeTo(this.releaseTime + duration.years(1));

      const payeeInitialBalance = await this.token.balanceOf(payee);

      await this.escrow.withdraw(payee, { from: owner });

      const payeeFinalBalance = await this.token.balanceOf(payee);
      payeeFinalBalance.sub(payeeInitialBalance).should.be.bignumber.equal(amount);
    });
  });
});
