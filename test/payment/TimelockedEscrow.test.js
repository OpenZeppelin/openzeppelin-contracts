const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');
const { latestTime } = require('../helpers/latestTime');
const { increaseTimeTo, duration } = require('../helpers/increaseTime');
const { ethGetBalance } = require('../helpers/web3');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const TimelockedEscrow = artifacts.require('TimelockedEscrow');

contract('TimelockedEscrow', function ([_, owner, payee, ...otherAccounts]) {
  it('reverts when release time is in the past', async function () {
    const releaseTime = (await latestTime()) - duration.minutes(1);
    await expectThrow(TimelockedEscrow.new(releaseTime, { from: owner }), EVMRevert);
  });

  context('once deployed', function () {
    const amount = web3.toWei(10.0, 'ether');

    beforeEach(async function () {
      this.releaseTime = (await latestTime()) + duration.years(1);
      this.escrow = await TimelockedEscrow.new(this.releaseTime, { from: owner });
      await this.escrow.deposit(payee, { from: owner, value: amount });
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

      const payeeInitialBalance = await ethGetBalance(payee);

      await this.escrow.withdraw(payee, { from: owner });

      const payeeFinalBalance = await ethGetBalance(payee);
      payeeFinalBalance.sub(payeeInitialBalance).should.be.bignumber.equal(amount);
    });

    it('allows withdrawals after release time', async function () {
      await increaseTimeTo(this.releaseTime + duration.years(1));

      const payeeInitialBalance = await ethGetBalance(payee);

      await this.escrow.withdraw(payee, { from: owner });

      const payeeFinalBalance = await ethGetBalance(payee);
      payeeFinalBalance.sub(payeeInitialBalance).should.be.bignumber.equal(amount);
    });
  });
});
