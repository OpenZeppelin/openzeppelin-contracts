const { balance, ether, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

function shouldBehaveLikeEscrow (primary, [payee1, payee2]) {
  const amount = ether('42');

  describe('as an escrow', function () {
    describe('deposits', function () {
      it('can accept a single deposit', async function () {
        await this.escrow.deposit(payee1, { from: primary, value: amount });

        expect(await balance.current(this.escrow.address)).to.be.bignumber.equal(amount);

        expect(await this.escrow.depositsOf(payee1)).to.be.bignumber.equal(amount);
      });

      it('can accept an empty deposit', async function () {
        await this.escrow.deposit(payee1, { from: primary, value: 0 });
      });

      it('only the primary account can deposit', async function () {
        await expectRevert(this.escrow.deposit(payee1, { from: payee2 }),
          'Secondary: caller is not the primary account'
        );
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
        await this.escrow.deposit(payee1, { from: primary, value: amount.muln(2) });

        expect(await balance.current(this.escrow.address)).to.be.bignumber.equal(amount.muln(3));

        expect(await this.escrow.depositsOf(payee1)).to.be.bignumber.equal(amount.muln(3));
      });

      it('can track deposits to multiple accounts', async function () {
        await this.escrow.deposit(payee1, { from: primary, value: amount });
        await this.escrow.deposit(payee2, { from: primary, value: amount.muln(2) });

        expect(await balance.current(this.escrow.address)).to.be.bignumber.equal(amount.muln(3));

        expect(await this.escrow.depositsOf(payee1)).to.be.bignumber.equal(amount);

        expect(await this.escrow.depositsOf(payee2)).to.be.bignumber.equal(amount.muln(2));
      });
    });

    describe('withdrawals', async function () {
      it('can withdraw payments', async function () {
        const balanceTracker = await balance.tracker(payee1);

        await this.escrow.deposit(payee1, { from: primary, value: amount });
        await this.escrow.withdraw(payee1, { from: primary });

        expect(await balanceTracker.delta()).to.be.bignumber.equal(amount);

        expect(await balance.current(this.escrow.address)).to.be.bignumber.equal('0');
        expect(await this.escrow.depositsOf(payee1)).to.be.bignumber.equal('0');
      });

      it('can do an empty withdrawal', async function () {
        await this.escrow.withdraw(payee1, { from: primary });
      });

      it('only the primary account can withdraw', async function () {
        await expectRevert(this.escrow.withdraw(payee1, { from: payee1 }),
          'Secondary: caller is not the primary account'
        );
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
