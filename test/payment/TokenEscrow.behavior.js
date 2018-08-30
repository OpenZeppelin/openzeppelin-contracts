const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');
const expectEvent = require('../helpers/expectEvent');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeTokenEscrow (owner, [payee1, payee2]) {
  const amount = new BigNumber(100);
  const MAX_UINT256 = new BigNumber(2).pow(256).minus(1);

  it('stores the token\'s address', async function () {
    const address = await this.escrow.token();
    address.should.be.equal(this.token.address);
  });

  context('when not approved by payer', function () {
    it('reverts on deposits', async function () {
      await expectThrow(
        this.escrow.deposit(payee1, amount, { from: owner }),
        EVMRevert
      );
    });
  });

  context('when approved by payer', function () {
    beforeEach(async function () {
      this.token.approve(this.escrow.address, MAX_UINT256, { from: owner });
    });

    describe('deposits', function () {
      it('accepts a single deposit', async function () {
        await this.escrow.deposit(payee1, amount, { from: owner });

        (await this.token.balanceOf(this.escrow.address)).should.be.bignumber.equal(amount);

        (await this.escrow.depositsOf(payee1)).should.be.bignumber.equal(amount);
      });

      it('accepts an empty deposit', async function () {
        await this.escrow.deposit(payee1, new BigNumber(0), { from: owner });
      });

      it('reverts when non-owners deposit', async function () {
        await expectThrow(this.escrow.deposit(payee1, amount, { from: payee2 }), EVMRevert);
      });

      it('emits a deposited event', async function () {
        const receipt = await this.escrow.deposit(payee1, amount, { from: owner });

        const event = expectEvent.inLogs(receipt.logs, 'Deposited', { payee: payee1 });
        event.args.tokenAmount.should.be.bignumber.equal(amount);
      });

      it('adds multiple deposits on a single account', async function () {
        await this.escrow.deposit(payee1, amount, { from: owner });
        await this.escrow.deposit(payee1, amount * 2, { from: owner });

        (await this.token.balanceOf(this.escrow.address)).should.be.bignumber.equal(amount * 3);

        (await this.escrow.depositsOf(payee1)).should.be.bignumber.equal(amount * 3);
      });

      it('tracks deposits to multiple accounts', async function () {
        await this.escrow.deposit(payee1, amount, { from: owner });
        await this.escrow.deposit(payee2, amount * 2, { from: owner });

        (await this.escrow.depositsOf(payee1)).should.be.bignumber.equal(amount);
        (await this.escrow.depositsOf(payee2)).should.be.bignumber.equal(amount * 2);

        (await this.token.balanceOf(this.escrow.address)).should.be.bignumber.equal(amount * 3);
      });
    });

    context('with deposit', function () {
      beforeEach(async function () {
        await this.escrow.deposit(payee1, amount, { from: owner });
      });

      describe('withdrawals', function () {
        it('withdraws payments', async function () {
          const payeeInitialBalance = await this.token.balanceOf(payee1);

          await this.escrow.withdraw(payee1, { from: owner });

          (await this.token.balanceOf(this.escrow.address)).should.be.bignumber.equal(0);

          (await this.escrow.depositsOf(payee1)).should.be.bignumber.equal(0);

          const payeeFinalBalance = await this.token.balanceOf(payee1);
          payeeFinalBalance.sub(payeeInitialBalance).should.be.bignumber.equal(amount);
        });

        it('accepts empty withdrawal', async function () {
          await this.escrow.withdraw(payee1, { from: owner });

          (await this.escrow.depositsOf(payee1)).should.be.bignumber.equal(0);

          await this.escrow.withdraw(payee1, { from: owner });
        });

        it('reverts when non-owners withdraw', async function () {
          await expectThrow(this.escrow.withdraw(payee1, { from: payee1 }), EVMRevert);
        });

        it('emits a withdrawn event', async function () {
          const receipt = await this.escrow.withdraw(payee1, { from: owner });

          const event = expectEvent.inLogs(receipt.logs, 'Withdrawn', { payee: payee1 });
          event.args.tokenAmount.should.be.bignumber.equal(amount);
        });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeTokenEscrow,
};
