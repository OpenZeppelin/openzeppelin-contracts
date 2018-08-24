const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');
const expectEvent = require('../helpers/expectEvent');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const TokenEscrow = artifacts.require('TokenEscrow');
const StandardToken = artifacts.require('StandardTokenMock');

contract('TokenEscrow', function ([_, owner, payer, payee1, payee2]) {
  const amount = new BigNumber(100);
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  it('requires a non-null token', async function () {
    await expectThrow(
      TokenEscrow.new(ZERO_ADDRESS, { from: owner }), EVMRevert
    );
  });

  context('with token', function () {
    beforeEach(async function () {
      this.standardToken = await StandardToken.new(payer, amount * 2);
      this.tokenEscrow = await TokenEscrow.new(this.standardToken.address, { from: owner });
    });

    context('when not approved by payer', function () {
      it('reverts on deposits', async function () {
        await expectThrow(
          this.tokenEscrow.deposit(payer, payee1, amount, { from: owner }),
          EVMRevert
        );
      });
    });

    context('when approved by payer', function () {
      beforeEach(async function () {
        this.standardToken.approve(this.tokenEscrow.address, amount * 2, { from: payer });
      });

      describe('deposits', function () {
        it('can accept a single deposit', async function () {
          await this.tokenEscrow.deposit(payer, payee1, amount, { from: owner });

          (await this.standardToken.balanceOf(this.tokenEscrow.address)).should.be.bignumber.equal(amount);

          (await this.tokenEscrow.depositsOf(payee1)).should.be.bignumber.equal(amount);
        });

        it('can accept an empty deposit', async function () {
          await this.tokenEscrow.deposit(payer, payee1, new BigNumber(0), { from: owner });
        });

        it('only the owner can deposit', async function () {
          await expectThrow(this.tokenEscrow.deposit(payer, payee1, amount, { from: payee2 }), EVMRevert);
        });

        it('emits a deposited event', async function () {
          const receipt = await this.tokenEscrow.deposit(payer, payee1, amount, { from: owner });

          const event = expectEvent.inLogs(receipt.logs, 'Deposited', { payee: payee1 });
          event.args.tokenAmount.should.be.bignumber.equal(amount);
        });

        it('can add multiple deposits on a single account', async function () {
          await this.tokenEscrow.deposit(payer, payee1, amount, { from: owner });
          await this.tokenEscrow.deposit(payer, payee1, amount, { from: owner });

          (await this.standardToken.balanceOf(this.tokenEscrow.address)).should.be.bignumber.equal(amount * 2);

          (await this.tokenEscrow.depositsOf(payee1)).should.be.bignumber.equal(amount * 2);
        });

        it('can track deposits to multiple accounts', async function () {
          for (const payee of [payee1, payee2]) {
            await this.tokenEscrow.deposit(payer, payee, amount, { from: owner });
            (await this.tokenEscrow.depositsOf(payee)).should.be.bignumber.equal(amount);
          }

          (await this.standardToken.balanceOf(this.tokenEscrow.address)).should.be.bignumber.equal(amount * 2);
        });
      });

      describe('withdrawals', function () {
        it('can withdraw payments', async function () {
          const payeeInitialBalance = await this.standardToken.balanceOf(payee1);

          await this.tokenEscrow.deposit(payer, payee1, amount, { from: owner });
          await this.tokenEscrow.withdraw(payee1, { from: owner });

          (await this.standardToken.balanceOf(this.tokenEscrow.address)).should.be.bignumber.equal(0);

          (await this.tokenEscrow.depositsOf(payee1)).should.be.bignumber.equal(0);

          const payeeFinalBalance = await this.standardToken.balanceOf(payee1);
          payeeFinalBalance.sub(payeeInitialBalance).should.be.bignumber.equal(amount);
        });

        it('can do an empty withdrawal', async function () {
          await this.tokenEscrow.withdraw(payee1, { from: owner });
        });

        it('only the owner can withdraw', async function () {
          await expectThrow(this.tokenEscrow.withdraw(payee1, { from: payee1 }), EVMRevert);
        });

        it('emits a withdrawn event', async function () {
          await this.tokenEscrow.deposit(payer, payee1, amount, { from: owner });
          const receipt = await this.tokenEscrow.withdraw(payee1, { from: owner });

          const event = expectEvent.inLogs(receipt.logs, 'Withdrawn', { payee: payee1 });
          event.args.tokenAmount.should.be.bignumber.equal(amount);
        });
      });
    });
  });
});
