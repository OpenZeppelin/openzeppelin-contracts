const expectEvent = require('../../helpers/expectEvent');
const shouldFail = require('../../helpers/shouldFail');
const { ethGetBalance } = require('../../helpers/web3');
const { balanceDifference } = require('../../helpers/balanceDifference');
const { ether } = require('../../helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeEscrow (primary, [payee1, payee2]) {
  const amount = ether(42.0);

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
        await shouldFail.reverting(this.escrow.deposit(payee1, { from: payee2 }));
      });

      it('emits a deposited event', async function () {
        const { logs } = await this.escrow.deposit(payee1, { from: primary, value: amount });
        expectEvent.inLogs(logs, 'Deposited', {
          payee: payee1,
          weiAmount: amount,
        });
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
        (await balanceDifference(payee1, async () => {
          await this.escrow.deposit(payee1, { from: primary, value: amount });
          await this.escrow.withdraw(payee1, { from: primary });
        })).should.be.bignumber.equal(amount);

        (await ethGetBalance(this.escrow.address)).should.be.bignumber.equal(0);
        (await this.escrow.depositsOf(payee1)).should.be.bignumber.equal(0);
      });

      it('can do an empty withdrawal', async function () {
        await this.escrow.withdraw(payee1, { from: primary });
      });

      it('only the primary account can withdraw', async function () {
        await shouldFail.reverting(this.escrow.withdraw(payee1, { from: payee1 }));
      });

      it('emits a withdrawn event', async function () {
        await this.escrow.deposit(payee1, { from: primary, value: amount });
        const { logs } = await this.escrow.withdraw(payee1, { from: primary });
        expectEvent.inLogs(logs, 'Withdrawn', {
          payee: payee1,
          weiAmount: amount,
        });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeEscrow,
};
