const expectEvent = require('../helpers/expectEvent');
const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');
const { ethGetBalance } = require('../helpers/web3');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeEscrow (primary, [payee1, payee2]) {
  const amount = web3.toWei(42.0, 'ether');

  describe('as an escrow', function () {
    describe('deposits', function () {
      it('can accept a single deposit', async function () {
        await this.escrow.deposit(payee1, { from: primary, value: amount });

        (await ethGetBalance(this.escrow.address)).should.be.bignumber.equal(amount);

        (await this.escrow.depositsOf(payee1)).should.be.bignumber.equal(amount);
      });

      it('can accept an empty deposit', async function () {
        await this.escrow.deposit(payee1, { from: primary, value: 0 });
      });

      it('only the primary account can deposit', async function () {
        await expectThrow(this.escrow.deposit(payee1, { from: payee2 }), EVMRevert);
      });

      it('emits a deposited event', async function () {
        const receipt = await this.escrow.deposit(payee1, { from: primary, value: amount });

        const event = expectEvent.inLogs(receipt.logs, 'Deposited', { payee: payee1 });
        event.args.weiAmount.should.be.bignumber.equal(amount);
      });

      it('can add multiple deposits on a single account', async function () {
        await this.escrow.deposit(payee1, { from: primary, value: amount });
        await this.escrow.deposit(payee1, { from: primary, value: amount * 2 });

        (await ethGetBalance(this.escrow.address)).should.be.bignumber.equal(amount * 3);

        (await this.escrow.depositsOf(payee1)).should.be.bignumber.equal(amount * 3);
      });

      it('can track deposits to multiple accounts', async function () {
        await this.escrow.deposit(payee1, { from: primary, value: amount });
        await this.escrow.deposit(payee2, { from: primary, value: amount * 2 });

        (await ethGetBalance(this.escrow.address)).should.be.bignumber.equal(amount * 3);

        (await this.escrow.depositsOf(payee1)).should.be.bignumber.equal(amount);

        (await this.escrow.depositsOf(payee2)).should.be.bignumber.equal(amount * 2);
      });
    });

    describe('withdrawals', async function () {
      it('can withdraw payments', async function () {
        const payeeInitialBalance = await ethGetBalance(payee1);

        await this.escrow.deposit(payee1, { from: primary, value: amount });
        await this.escrow.withdraw(payee1, { from: primary });

        (await ethGetBalance(this.escrow.address)).should.be.bignumber.equal(0);

        (await this.escrow.depositsOf(payee1)).should.be.bignumber.equal(0);

        const payeeFinalBalance = await ethGetBalance(payee1);
        payeeFinalBalance.sub(payeeInitialBalance).should.be.bignumber.equal(amount);
      });

      it('can do an empty withdrawal', async function () {
        await this.escrow.withdraw(payee1, { from: primary });
      });

      it('only the primary account can withdraw', async function () {
        await expectThrow(this.escrow.withdraw(payee1, { from: payee1 }), EVMRevert);
      });

      it('emits a withdrawn event', async function () {
        await this.escrow.deposit(payee1, { from: primary, value: amount });
        const receipt = await this.escrow.withdraw(payee1, { from: primary });

        const event = expectEvent.inLogs(receipt.logs, 'Withdrawn', { payee: payee1 });
        event.args.weiAmount.should.be.bignumber.equal(amount);
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeEscrow,
};
