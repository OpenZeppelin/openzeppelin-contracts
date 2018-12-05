const shouldFail = require('../../helpers/shouldFail');
const expectEvent = require('../../helpers/expectEvent');
const { balanceDifference } = require('../../helpers/balanceDifference');
const { ether } = require('../../helpers/ether');
const { ZERO_ADDRESS } = require('../../helpers/constants');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const RefundEscrow = artifacts.require('RefundEscrow');

contract('RefundEscrow', function ([_, primary, beneficiary, refundee1, refundee2]) {
  const amount = ether(54.0);
  const refundees = [refundee1, refundee2];

  it('requires a non-null beneficiary', async function () {
    await shouldFail.reverting(
      RefundEscrow.new(ZERO_ADDRESS, { from: primary })
    );
  });

  context('once deployed', function () {
    beforeEach(async function () {
      this.escrow = await RefundEscrow.new(beneficiary, { from: primary });
    });

    context('active state', function () {
      it('has beneficiary and state', async function () {
        (await this.escrow.beneficiary()).should.be.equal(beneficiary);
        (await this.escrow.state()).should.be.bignumber.equal(0);
      });

      it('accepts deposits', async function () {
        await this.escrow.deposit(refundee1, { from: primary, value: amount });

        (await this.escrow.depositsOf(refundee1)).should.be.bignumber.equal(amount);
      });

      it('does not refund refundees', async function () {
        await this.escrow.deposit(refundee1, { from: primary, value: amount });
        await shouldFail.reverting(this.escrow.withdraw(refundee1));
      });

      it('does not allow beneficiary withdrawal', async function () {
        await this.escrow.deposit(refundee1, { from: primary, value: amount });
        await shouldFail.reverting(this.escrow.beneficiaryWithdraw());
      });
    });

    it('only the primary account can enter closed state', async function () {
      await shouldFail.reverting(this.escrow.close({ from: beneficiary }));

      const { logs } = await this.escrow.close({ from: primary });
      expectEvent.inLogs(logs, 'RefundsClosed');
    });

    context('closed state', function () {
      beforeEach(async function () {
        await Promise.all(refundees.map(refundee => this.escrow.deposit(refundee, { from: primary, value: amount })));

        await this.escrow.close({ from: primary });
      });

      it('rejects deposits', async function () {
        await shouldFail.reverting(this.escrow.deposit(refundee1, { from: primary, value: amount }));
      });

      it('does not refund refundees', async function () {
        await shouldFail.reverting(this.escrow.withdraw(refundee1));
      });

      it('allows beneficiary withdrawal', async function () {
        (await balanceDifference(beneficiary, () =>
          this.escrow.beneficiaryWithdraw()
        )).should.be.bignumber.equal(amount * refundees.length);
      });

      it('prevents entering the refund state', async function () {
        await shouldFail.reverting(this.escrow.enableRefunds({ from: primary }));
      });

      it('prevents re-entering the closed state', async function () {
        await shouldFail.reverting(this.escrow.close({ from: primary }));
      });
    });

    it('only the primary account can enter refund state', async function () {
      await shouldFail.reverting(this.escrow.enableRefunds({ from: beneficiary }));

      const { logs } = await this.escrow.enableRefunds({ from: primary });
      expectEvent.inLogs(logs, 'RefundsEnabled');
    });

    context('refund state', function () {
      beforeEach(async function () {
        await Promise.all(refundees.map(refundee => this.escrow.deposit(refundee, { from: primary, value: amount })));

        await this.escrow.enableRefunds({ from: primary });
      });

      it('rejects deposits', async function () {
        await shouldFail.reverting(this.escrow.deposit(refundee1, { from: primary, value: amount }));
      });

      it('refunds refundees', async function () {
        for (const refundee of [refundee1, refundee2]) {
          (await balanceDifference(refundee, () =>
            this.escrow.withdraw(refundee, { from: primary }))
          ).should.be.bignumber.equal(amount);
        }
      });

      it('does not allow beneficiary withdrawal', async function () {
        await shouldFail.reverting(this.escrow.beneficiaryWithdraw());
      });

      it('prevents entering the closed state', async function () {
        await shouldFail.reverting(this.escrow.close({ from: primary }));
      });

      it('prevents re-entering the refund state', async function () {
        await shouldFail.reverting(this.escrow.enableRefunds({ from: primary }));
      });
    });
  });
});
