const expectEvent = require('../helpers/expectEvent');
const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');
const { ethGetBalance } = require('../helpers/web3');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeEscrow (owner, [payee1, payee2]) {
  const amount = web3.toWei(42.0, 'ether');

  describe('as an escrow', function () {
    describe('deposits', function () {
      it('can accept a single deposit', async function () {
        await this.escrow.deposit(payee1, { from: owner, value: amount });

        const balance = await ethGetBalance(this.escrow.address);
        const deposit = await this.escrow.depositsOf(payee1);

        balance.should.be.bignumber.equal(amount);
        deposit.should.be.bignumber.equal(amount);
      });

      it('can accept an empty deposit', async function () {
        await this.escrow.deposit(payee1, { from: owner, value: 0 });
      });

      it('only the owner can deposit', async function () {
        await expectThrow(this.escrow.deposit(payee1, { from: payee2 }), EVMRevert);
      });

      it('emits a deposited event', async function () {
        const receipt = await this.escrow.deposit(payee1, { from: owner, value: amount });

        const event = await expectEvent.inLogs(receipt.logs, 'Deposited', { payee: payee1 });
        event.args.weiAmount.should.be.bignumber.equal(amount);
      });

      it('can add multiple deposits on a single account', async function () {
        await this.escrow.deposit(payee1, { from: owner, value: amount });
        await this.escrow.deposit(payee1, { from: owner, value: amount * 2 });

        const balance = await ethGetBalance(this.escrow.address);
        const deposit = await this.escrow.depositsOf(payee1);

        balance.should.be.bignumber.equal(amount * 3);
        deposit.should.be.bignumber.equal(amount * 3);
      });

      it('can track deposits to multiple accounts', async function () {
        await this.escrow.deposit(payee1, { from: owner, value: amount });
        await this.escrow.deposit(payee2, { from: owner, value: amount * 2 });

        const balance = await ethGetBalance(this.escrow.address);
        const depositPayee1 = await this.escrow.depositsOf(payee1);
        const depositPayee2 = await this.escrow.depositsOf(payee2);

        balance.should.be.bignumber.equal(amount * 3);
        depositPayee1.should.be.bignumber.equal(amount);
        depositPayee2.should.be.bignumber.equal(amount * 2);
      });
    });

    describe('withdrawals', async function () {
      it('can withdraw payments', async function () {
        const payeeInitialBalance = await ethGetBalance(payee1);

        await this.escrow.deposit(payee1, { from: owner, value: amount });
        await this.escrow.withdraw(payee1, { from: owner });

        const escrowBalance = await ethGetBalance(this.escrow.address);
        const finalDeposit = await this.escrow.depositsOf(payee1);
        const payeeFinalBalance = await ethGetBalance(payee1);

        escrowBalance.should.be.bignumber.equal(0);
        finalDeposit.should.be.bignumber.equal(0);
        payeeFinalBalance.sub(payeeInitialBalance).should.be.bignumber.equal(amount);
      });

      it('can do an empty withdrawal', async function () {
        await this.escrow.withdraw(payee1, { from: owner });
      });

      it('only the owner can withdraw', async function () {
        await expectThrow(this.escrow.withdraw(payee1, { from: payee1 }), EVMRevert);
      });

      it('emits a withdrawn event', async function () {
        await this.escrow.deposit(payee1, { from: owner, value: amount });
        const receipt = await this.escrow.withdraw(payee1, { from: owner });

        const event = await expectEvent.inLogs(receipt.logs, 'Withdrawn', { payee: payee1 });
        event.args.weiAmount.should.be.bignumber.equal(amount);
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeEscrow,
};
