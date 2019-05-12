const { balance, constants, ether, expectEvent, shouldFail } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const RefundEscrow = artifacts.require('RefundEscrow');

contract('RefundEscrow', function ([_, primary, beneficiary, refundee1, refundee2]) {
  const amount = ether('54');
  const refundees = [refundee1, refundee2];

  it('requires a non-null beneficiary', async function () {
    await shouldFail.reverting.withMessage(
      RefundEscrow.new(ZERO_ADDRESS, { from: primary }), 'RefundEscrow: beneficiary is the zero address'
    );
  });

  context('once deployed', function () {
    beforeEach(async function () {
      this.escrow = await RefundEscrow.new(beneficiary, { from: primary });
    });

    context('active state', function () {
      it('has beneficiary and state', async function () {
        (await this.escrow.beneficiary()).should.be.equal(beneficiary);
        (await this.escrow.state()).should.be.bignumber.equal('0');
      });

      it('accepts deposits', async function () {
        await this.escrow.deposit(refundee1, { from: primary, value: amount });

        (await this.escrow.depositsOf(refundee1)).should.be.bignumber.equal(amount);
      });

      it('does not refund refundees', async function () {
        await this.escrow.deposit(refundee1, { from: primary, value: amount });
        await shouldFail.reverting.withMessage(this.escrow.withdraw(refundee1),
          'ConditionalEscrow: payee is not allowed to withdraw'
        );
      });

      it('does not allow beneficiary withdrawal', async function () {
        await this.escrow.deposit(refundee1, { from: primary, value: amount });
        await shouldFail.reverting.withMessage(this.escrow.beneficiaryWithdraw(),
          'RefundEscrow: beneficiary can only withdraw while closed'
        );
      });
    });

    it('only the primary account can enter closed state', async function () {
      await shouldFail.reverting.withMessage(this.escrow.close({ from: beneficiary }),
        'Secondary: caller is not the primary account'
      );

      const { logs } = await this.escrow.close({ from: primary });
      expectEvent.inLogs(logs, 'RefundsClosed');
    });

    context('closed state', function () {
      beforeEach(async function () {
        await Promise.all(refundees.map(refundee => this.escrow.deposit(refundee, { from: primary, value: amount })));

        await this.escrow.close({ from: primary });
      });

      it('rejects deposits', async function () {
        await shouldFail.reverting.withMessage(this.escrow.deposit(refundee1, { from: primary, value: amount }),
          'RefundEscrow: can only deposit while active'
        );
      });

      it('does not refund refundees', async function () {
        await shouldFail.reverting.withMessage(this.escrow.withdraw(refundee1),
          'ConditionalEscrow: payee is not allowed to withdraw'
        );
      });

      it('allows beneficiary withdrawal', async function () {
        const balanceTracker = await balance.tracker(beneficiary);
        await this.escrow.beneficiaryWithdraw();
        (await balanceTracker.delta()).should.be.bignumber.equal(amount.muln(refundees.length));
      });

      it('prevents entering the refund state', async function () {
        await shouldFail.reverting.withMessage(this.escrow.enableRefunds({ from: primary }),
          'RefundEscrow: can only enable refunds while active'
        );
      });

      it('prevents re-entering the closed state', async function () {
        await shouldFail.reverting.withMessage(this.escrow.close({ from: primary }),
          'RefundEscrow: can only close while active'
        );
      });
    });

    it('only the primary account can enter refund state', async function () {
      await shouldFail.reverting.withMessage(this.escrow.enableRefunds({ from: beneficiary }),
        'Secondary: caller is not the primary account'
      );

      const { logs } = await this.escrow.enableRefunds({ from: primary });
      expectEvent.inLogs(logs, 'RefundsEnabled');
    });

    context('refund state', function () {
      beforeEach(async function () {
        await Promise.all(refundees.map(refundee => this.escrow.deposit(refundee, { from: primary, value: amount })));

        await this.escrow.enableRefunds({ from: primary });
      });

      it('rejects deposits', async function () {
        await shouldFail.reverting.withMessage(this.escrow.deposit(refundee1, { from: primary, value: amount }),
          'RefundEscrow: can only deposit while active'
        );
      });

      it('refunds refundees', async function () {
        for (const refundee of [refundee1, refundee2]) {
          const balanceTracker = await balance.tracker(refundee);
          await this.escrow.withdraw(refundee, { from: primary });
          (await balanceTracker.delta()).should.be.bignumber.equal(amount);
        }
      });

      it('does not allow beneficiary withdrawal', async function () {
        await shouldFail.reverting.withMessage(this.escrow.beneficiaryWithdraw(),
          'RefundEscrow: beneficiary can only withdraw while closed'
        );
      });

      it('prevents entering the closed state', async function () {
        await shouldFail.reverting.withMessage(this.escrow.close({ from: primary }),
          'RefundEscrow: can only close while active'
        );
      });

      it('prevents re-entering the refund state', async function () {
        await shouldFail.reverting.withMessage(this.escrow.enableRefunds({ from: primary }),
          'RefundEscrow: can only enable refunds while active'
        );
      });
    });
  });
});
