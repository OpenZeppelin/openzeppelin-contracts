const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');
const expectEvent = require('../helpers/expectEvent');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const TokenEscrow = artifacts.require('TokenEscrow');
const StandardToken = artifacts.require('StandardTokenMock');

contract('TokenEscrow', function ([_, owner, payee1, payee2]) {
  const amount = new BigNumber(100);
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const MAX_UINT256 = new BigNumber(2).pow(256).minus(1);

  it('reverts when deployed with a null token address', async function () {
    await expectThrow(
      TokenEscrow.new(ZERO_ADDRESS, { from: owner }), EVMRevert
    );
  });

  context('with token', function () {
    beforeEach(async function () {
      this.token = await StandardToken.new(owner, MAX_UINT256);
      this.tokenEscrow = await TokenEscrow.new(this.token.address, { from: owner });
    });

    it('stores the token\'s address', async function () {
      const address = await this.tokenEscrow.token();
      address.should.be.equal(this.token.address);
    });

    context('when not approved by payer', function () {
      it('reverts on deposits', async function () {
        await expectThrow(
          this.tokenEscrow.deposit(payee1, amount, { from: owner }),
          EVMRevert
        );
      });
    });

    context('when approved by payer', function () {
      beforeEach(async function () {
        this.token.approve(this.tokenEscrow.address, MAX_UINT256, { from: owner });
      });

      describe('deposits', function () {
        it('accepts a single deposit', async function () {
          await this.tokenEscrow.deposit(payee1, amount, { from: owner });

          (await this.token.balanceOf(this.tokenEscrow.address)).should.be.bignumber.equal(amount);

          (await this.tokenEscrow.depositsOf(payee1)).should.be.bignumber.equal(amount);
        });

        it('accepts an empty deposit', async function () {
          await this.tokenEscrow.deposit(payee1, new BigNumber(0), { from: owner });
        });

        it('reverts when non-owners deposit', async function () {
          await expectThrow(this.tokenEscrow.deposit(payee1, amount, { from: payee2 }), EVMRevert);
        });

        it('emits a deposited event', async function () {
          const receipt = await this.tokenEscrow.deposit(payee1, amount, { from: owner });

          const event = expectEvent.inLogs(receipt.logs, 'Deposited', { payee: payee1 });
          event.args.tokenAmount.should.be.bignumber.equal(amount);
        });

        it('adds multiple deposits on a single account', async function () {
          await this.tokenEscrow.deposit(payee1, amount, { from: owner });
          await this.tokenEscrow.deposit(payee1, amount * 2, { from: owner });

          (await this.token.balanceOf(this.tokenEscrow.address)).should.be.bignumber.equal(amount * 3);

          (await this.tokenEscrow.depositsOf(payee1)).should.be.bignumber.equal(amount * 3);
        });

        it('tracks deposits to multiple accounts', async function () {
          await this.tokenEscrow.deposit(payee1, amount, { from: owner });
          await this.tokenEscrow.deposit(payee2, amount * 2, { from: owner });

          (await this.tokenEscrow.depositsOf(payee1)).should.be.bignumber.equal(amount);
          (await this.tokenEscrow.depositsOf(payee2)).should.be.bignumber.equal(amount * 2);

          (await this.token.balanceOf(this.tokenEscrow.address)).should.be.bignumber.equal(amount * 3);
        });
      });

      context('with deposit', function () {
        beforeEach(async function () {
          await this.tokenEscrow.deposit(payee1, amount, { from: owner });
        });

        describe('withdrawals', function () {
          it('withdraws payments', async function () {
            const payeeInitialBalance = await this.token.balanceOf(payee1);

            await this.tokenEscrow.withdraw(payee1, { from: owner });

            (await this.token.balanceOf(this.tokenEscrow.address)).should.be.bignumber.equal(0);

            (await this.tokenEscrow.depositsOf(payee1)).should.be.bignumber.equal(0);

            const payeeFinalBalance = await this.token.balanceOf(payee1);
            payeeFinalBalance.sub(payeeInitialBalance).should.be.bignumber.equal(amount);
          });

          it('accepts empty withdrawal', async function () {
            await this.tokenEscrow.withdraw(payee1, { from: owner });

            (await this.tokenEscrow.depositsOf(payee1)).should.be.bignumber.equal(0);

            await this.tokenEscrow.withdraw(payee1, { from: owner });
          });

          it('reverts when non-owners withdraw', async function () {
            await expectThrow(this.tokenEscrow.withdraw(payee1, { from: payee1 }), EVMRevert);
          });

          it('emits a withdrawn event', async function () {
            const receipt = await this.tokenEscrow.withdraw(payee1, { from: owner });

            const event = expectEvent.inLogs(receipt.logs, 'Withdrawn', { payee: payee1 });
            event.args.tokenAmount.should.be.bignumber.equal(amount);
          });
        });
      });
    });
  });
});
