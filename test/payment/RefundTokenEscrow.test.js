const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');
const expectEvent = require('../helpers/expectEvent');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const RefundTokenEscrow = artifacts.require('RefundTokenEscrow');
const StandardToken = artifacts.require('StandardTokenMock');

contract('RefundTokenEscrow', function ([_, owner, beneficiary, refundee1, refundee2]) {
  const amount = web3.toWei(54.0, 'ether');
  const refundees = [refundee1, refundee2];
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const MAX_UINT256 = new BigNumber(2).pow(256).minus(1);

  const RefundStates = {
    'Active': 0,
    'Refunding': 1,
    'Closed': 2,
  };

  it('reverts when deployed with a null token address', async function () {
    await expectThrow(
      RefundTokenEscrow.new(ZERO_ADDRESS, beneficiary, { from: owner })
    );
  });

  context('with token', function () {
    beforeEach(async function () {
      this.token = await StandardToken.new(owner, MAX_UINT256);
    });

    it('reverts when deployed with a null beneficiary', async function () {
      await expectThrow(
        RefundTokenEscrow.new(this.token.address, ZERO_ADDRESS, { from: owner })
      );
    });

    context('once deployed', function () {
      beforeEach(async function () {
        this.escrow = await RefundTokenEscrow.new(this.token.address, beneficiary, { from: owner });
        this.token.approve(this.escrow.address, MAX_UINT256, { from: owner });
      });

      it('is in active state', async function () {
        (await this.escrow.state()).should.be.bignumber.equal(RefundStates.Active);
      });

      it('stores the beneficiary', async function () {
        (await this.escrow.beneficiary()).should.be.equal(beneficiary);
      });

      context('active state', function () {
        it('accepts deposits', async function () {
          await this.escrow.deposit(refundee1, amount, { from: owner });

          (await this.escrow.depositsOf(refundee1)).should.be.bignumber.equal(amount);

          (await this.token.balanceOf(this.escrow.address)).should.be.bignumber.equal(amount);
        });

        it('reverts on refund attempts', async function () {
          await this.escrow.deposit(refundee1, amount, { from: owner });
          await expectThrow(this.escrow.withdraw(refundee1, { from: owner }), EVMRevert);
        });

        it('reverts on beneficiary withdrawal', async function () {
          await this.escrow.deposit(refundee1, amount, { from: owner });
          await expectThrow(this.escrow.beneficiaryWithdraw(), EVMRevert);
        });
      });

      describe('entering close state', function () {
        it('reverts when non-owners enter close state', async function () {
          await expectThrow(this.escrow.close({ from: beneficiary }), EVMRevert);
        });

        it('emits Closed event when owner enters close state', async function () {
          const receipt = await this.escrow.close({ from: owner });

          (await this.escrow.state()).should.be.bignumber.equal(RefundStates.Closed);

          expectEvent.inLogs(receipt.logs, 'Closed');
        });
      });

      context('closed state', function () {
        beforeEach(async function () {
          await Promise.all(refundees.map(
            refundee => this.escrow.deposit(refundee, amount, { from: owner }))
          );

          await this.escrow.close({ from: owner });
        });

        it('rejects deposits', async function () {
          await expectThrow(this.escrow.deposit(refundee1, amount, { from: owner }), EVMRevert);
        });

        it('reverts on refund attempts', async function () {
          await expectThrow(this.escrow.withdraw(refundee1), EVMRevert);
        });

        it('allows beneficiary withdrawal', async function () {
          const beneficiaryInitialBalance = await this.token.balanceOf(beneficiary);
          await this.escrow.beneficiaryWithdraw();
          const beneficiaryFinalBalance = await this.token.balanceOf(beneficiary);

          beneficiaryFinalBalance
            .sub(beneficiaryInitialBalance)
            .should.be.bignumber.equal(amount * refundees.length);

          (await this.token.balanceOf(this.escrow.address)).should.be.bignumber.equal(0);
        });

        it('reverts on entering the refund state', async function () {
          await expectThrow(this.escrow.enableRefunds({ from: owner }), EVMRevert);
        });

        it('reverts on re-entering the closed state', async function () {
          await expectThrow(this.escrow.close({ from: owner }), EVMRevert);
        });
      });

      describe('entering refund state', function () {
        it('reverts when non-owners enter refund state', async function () {
          await expectThrow(this.escrow.enableRefunds({ from: beneficiary }), EVMRevert);
        });

        it('emits RefundsEnabled event when owner enters refund state', async function () {
          const receipt = await this.escrow.enableRefunds({ from: owner });

          (await this.escrow.state()).should.be.bignumber.equal(RefundStates.Refunding);

          expectEvent.inLogs(receipt.logs, 'RefundsEnabled');
        });
      });

      context('refund state', function () {
        beforeEach(async function () {
          await Promise.all(refundees.map(
            refundee => this.escrow.deposit(refundee, amount, { from: owner }))
          );

          await this.escrow.enableRefunds({ from: owner });
        });

        it('rejects deposits', async function () {
          await expectThrow(this.escrow.deposit(refundee1, amount, { from: owner }), EVMRevert);
        });

        it('refunds refundees', async function () {
          for (const refundee of refundees) {
            const refundeeInitialBalance = await this.token.balanceOf(refundee);
            await this.escrow.withdraw(refundee, { from: owner });
            const refundeeFinalBalance = await this.token.balanceOf(refundee);

            refundeeFinalBalance.sub(refundeeInitialBalance).should.be.bignumber.equal(amount);
          }

          await this.escrow.withdraw(refundee1, { from: owner });

          (await this.token.balanceOf(this.escrow.address)).should.be.bignumber.equal(0);
        });

        it('reverts on beneficiary withdrawal', async function () {
          await expectThrow(this.escrow.beneficiaryWithdraw(), EVMRevert);
        });

        it('reverts on entering the closed state', async function () {
          await expectThrow(this.escrow.close({ from: owner }), EVMRevert);
        });

        it('reverts on re-entering the refund state', async function () {
          await expectThrow(this.escrow.enableRefunds({ from: owner }), EVMRevert);
        });
      });
    });
  });
});
