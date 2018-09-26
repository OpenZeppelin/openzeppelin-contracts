const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');
const expectEvent = require('../helpers/expectEvent');
const { ethGetBalance } = require('../helpers/web3');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const RefundEscrow = artifacts.require('RefundEscrow');

contract('RefundEscrow', function ([_, primary, beneficiary, refundee1, refundee2]) {
  const amount = web3.toWei(54.0, 'ether');
  const refundees = [refundee1, refundee2];
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  it('requires a non-null beneficiary', async function () {
    await expectThrow(
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
        await expectThrow(this.escrow.withdraw(refundee1), EVMRevert);
      });

      it('does not allow beneficiary withdrawal', async function () {
        await this.escrow.deposit(refundee1, { from: primary, value: amount });
        await expectThrow(this.escrow.beneficiaryWithdraw(), EVMRevert);
      });
    });

    it('only the primary account can enter closed state', async function () {
      await expectThrow(this.escrow.close({ from: beneficiary }), EVMRevert);

      const receipt = await this.escrow.close({ from: primary });

      expectEvent.inLogs(receipt.logs, 'Closed');
    });

    context('closed state', function () {
      beforeEach(async function () {
        await Promise.all(refundees.map(refundee => this.escrow.deposit(refundee, { from: primary, value: amount })));

        await this.escrow.close({ from: primary });
      });

      it('rejects deposits', async function () {
        await expectThrow(this.escrow.deposit(refundee1, { from: primary, value: amount }), EVMRevert);
      });

      it('does not refund refundees', async function () {
        await expectThrow(this.escrow.withdraw(refundee1), EVMRevert);
      });

      it('allows beneficiary withdrawal', async function () {
        const beneficiaryInitialBalance = await ethGetBalance(beneficiary);
        await this.escrow.beneficiaryWithdraw();
        const beneficiaryFinalBalance = await ethGetBalance(beneficiary);

        beneficiaryFinalBalance.sub(beneficiaryInitialBalance).should.be.bignumber.equal(amount * refundees.length);
      });

      it('prevents entering the refund state', async function () {
        await expectThrow(this.escrow.enableRefunds({ from: primary }), EVMRevert);
      });

      it('prevents re-entering the closed state', async function () {
        await expectThrow(this.escrow.close({ from: primary }), EVMRevert);
      });
    });

    it('only the primary account can enter refund state', async function () {
      await expectThrow(this.escrow.enableRefunds({ from: beneficiary }), EVMRevert);

      const receipt = await this.escrow.enableRefunds({ from: primary });

      expectEvent.inLogs(receipt.logs, 'RefundsEnabled');
    });

    context('refund state', function () {
      beforeEach(async function () {
        await Promise.all(refundees.map(refundee => this.escrow.deposit(refundee, { from: primary, value: amount })));

        await this.escrow.enableRefunds({ from: primary });
      });

      it('rejects deposits', async function () {
        await expectThrow(this.escrow.deposit(refundee1, { from: primary, value: amount }), EVMRevert);
      });

      it('refunds refundees', async function () {
        for (const refundee of [refundee1, refundee2]) {
          const refundeeInitialBalance = await ethGetBalance(refundee);
          await this.escrow.withdraw(refundee, { from: primary });
          const refundeeFinalBalance = await ethGetBalance(refundee);

          refundeeFinalBalance.sub(refundeeInitialBalance).should.be.bignumber.equal(amount);
        }
      });

      it('does not allow beneficiary withdrawal', async function () {
        await expectThrow(this.escrow.beneficiaryWithdraw(), EVMRevert);
      });

      it('prevents entering the closed state', async function () {
        await expectThrow(this.escrow.close({ from: primary }), EVMRevert);
      });

      it('prevents re-entering the refund state', async function () {
        await expectThrow(this.escrow.enableRefunds({ from: primary }), EVMRevert);
      });
    });
  });
});
