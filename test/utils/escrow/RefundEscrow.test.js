const { balance, constants, ether, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const RefundEscrow = artifacts.require('RefundEscrow');

contract('RefundEscrow', function (accounts) {
  const [ owner, beneficiary, refundee1, refundee2 ] = accounts;

  const amount = ether('54');
  const refundees = [refundee1, refundee2];

  it('requires a non-null beneficiary', async function () {
    await expectRevert(
      RefundEscrow.new(ZERO_ADDRESS, { from: owner }), 'RefundEscrow: beneficiary is the zero address',
    );
  });

  context('once deployed', function () {
    beforeEach(async function () {
      this.escrow = await RefundEscrow.new(beneficiary, { from: owner });
    });

    context('active state', function () {
      it('has beneficiary and state', async function () {
        expect(await this.escrow.beneficiary()).to.equal(beneficiary);
        expect(await this.escrow.state()).to.be.bignumber.equal('0');
      });

      it('accepts deposits', async function () {
        await this.escrow.deposit(refundee1, { from: owner, value: amount });

        expect(await this.escrow.depositsOf(refundee1)).to.be.bignumber.equal(amount);
      });

      it('does not refund refundees', async function () {
        await this.escrow.deposit(refundee1, { from: owner, value: amount });
        await expectRevert(this.escrow.withdraw(refundee1),
          'ConditionalEscrow: payee is not allowed to withdraw',
        );
      });

      it('does not allow beneficiary withdrawal', async function () {
        await this.escrow.deposit(refundee1, { from: owner, value: amount });
        await expectRevert(this.escrow.beneficiaryWithdraw(),
          'RefundEscrow: beneficiary can only withdraw while closed',
        );
      });
    });

    it('only the owner can enter closed state', async function () {
      await expectRevert(this.escrow.close({ from: beneficiary }),
        'Ownable: caller is not the owner',
      );

      const { logs } = await this.escrow.close({ from: owner });
      expectEvent.inLogs(logs, 'RefundsClosed');
    });

    context('closed state', function () {
      beforeEach(async function () {
        await Promise.all(refundees.map(refundee => this.escrow.deposit(refundee, { from: owner, value: amount })));

        await this.escrow.close({ from: owner });
      });

      it('rejects deposits', async function () {
        await expectRevert(this.escrow.deposit(refundee1, { from: owner, value: amount }),
          'RefundEscrow: can only deposit while active',
        );
      });

      it('does not refund refundees', async function () {
        await expectRevert(this.escrow.withdraw(refundee1),
          'ConditionalEscrow: payee is not allowed to withdraw',
        );
      });

      it('allows beneficiary withdrawal', async function () {
        const balanceTracker = await balance.tracker(beneficiary);
        await this.escrow.beneficiaryWithdraw();
        expect(await balanceTracker.delta()).to.be.bignumber.equal(amount.muln(refundees.length));
      });

      it('prevents entering the refund state', async function () {
        await expectRevert(this.escrow.enableRefunds({ from: owner }),
          'RefundEscrow: can only enable refunds while active',
        );
      });

      it('prevents re-entering the closed state', async function () {
        await expectRevert(this.escrow.close({ from: owner }),
          'RefundEscrow: can only close while active',
        );
      });
    });

    it('only the owner can enter refund state', async function () {
      await expectRevert(this.escrow.enableRefunds({ from: beneficiary }),
        'Ownable: caller is not the owner',
      );

      const { logs } = await this.escrow.enableRefunds({ from: owner });
      expectEvent.inLogs(logs, 'RefundsEnabled');
    });

    context('refund state', function () {
      beforeEach(async function () {
        await Promise.all(refundees.map(refundee => this.escrow.deposit(refundee, { from: owner, value: amount })));

        await this.escrow.enableRefunds({ from: owner });
      });

      it('rejects deposits', async function () {
        await expectRevert(this.escrow.deposit(refundee1, { from: owner, value: amount }),
          'RefundEscrow: can only deposit while active',
        );
      });

      it('refunds refundees', async function () {
        for (const refundee of [refundee1, refundee2]) {
          const balanceTracker = await balance.tracker(refundee);
          await this.escrow.withdraw(refundee, { from: owner });
          expect(await balanceTracker.delta()).to.be.bignumber.equal(amount);
        }
      });

      it('does not allow beneficiary withdrawal', async function () {
        await expectRevert(this.escrow.beneficiaryWithdraw(),
          'RefundEscrow: beneficiary can only withdraw while closed',
        );
      });

      it('prevents entering the closed state', async function () {
        await expectRevert(this.escrow.close({ from: owner }),
          'RefundEscrow: can only close while active',
        );
      });

      it('prevents re-entering the refund state', async function () {
        await expectRevert(this.escrow.enableRefunds({ from: owner }),
          'RefundEscrow: can only enable refunds while active',
        );
      });
    });
  });
});
