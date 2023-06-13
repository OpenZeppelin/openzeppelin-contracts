const { BN, constants, expectEvent } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');
const { expectRevertCustomError } = require('../../../helpers/customError');

function shouldBehaveLikeERC20Burnable(owner, initialBalance, [burner]) {
  describe('burn', function () {
    describe('when the given amount is not greater than balance of the sender', function () {
      context('for a zero amount', function () {
        shouldBurn(new BN(0));
      });

      context('for a non-zero amount', function () {
        shouldBurn(new BN(100));
      });

      function shouldBurn(amount) {
        beforeEach(async function () {
          this.receipt = await this.token.burn(amount, { from: owner });
        });

        it('burns the requested amount', async function () {
          expect(await this.token.balanceOf(owner)).to.be.bignumber.equal(initialBalance.sub(amount));
        });

        it('emits a transfer event', async function () {
          expectEvent(this.receipt, 'Transfer', {
            from: owner,
            to: ZERO_ADDRESS,
            value: amount,
          });
        });
      }
    });

    describe('when the given amount is greater than the balance of the sender', function () {
      const amount = initialBalance.addn(1);

      it('reverts', async function () {
        await expectRevertCustomError(this.token.burn(amount, { from: owner }), 'ERC20InsufficientBalance', [
          owner,
          initialBalance,
          amount,
        ]);
      });
    });
  });

  describe('burnFrom', function () {
    describe('on success', function () {
      context('for a zero amount', function () {
        shouldBurnFrom(new BN(0));
      });

      context('for a non-zero amount', function () {
        shouldBurnFrom(new BN(100));
      });

      function shouldBurnFrom(amount) {
        const originalAllowance = amount.muln(3);

        beforeEach(async function () {
          await this.token.approve(burner, originalAllowance, { from: owner });
          this.receipt = await this.token.burnFrom(owner, amount, { from: burner });
        });

        it('burns the requested amount', async function () {
          expect(await this.token.balanceOf(owner)).to.be.bignumber.equal(initialBalance.sub(amount));
        });

        it('decrements allowance', async function () {
          expect(await this.token.allowance(owner, burner)).to.be.bignumber.equal(originalAllowance.sub(amount));
        });

        it('emits a transfer event', async function () {
          expectEvent(this.receipt, 'Transfer', {
            from: owner,
            to: ZERO_ADDRESS,
            value: amount,
          });
        });
      }
    });

    describe('when the given amount is greater than the balance of the sender', function () {
      const amount = initialBalance.addn(1);

      it('reverts', async function () {
        await this.token.approve(burner, amount, { from: owner });
        await expectRevertCustomError(
          this.token.burnFrom(owner, amount, { from: burner }),
          'ERC20InsufficientBalance',
          [owner, initialBalance, amount],
        );
      });
    });

    describe('when the given amount is greater than the allowance', function () {
      const allowance = new BN(100);

      it('reverts', async function () {
        await this.token.approve(burner, allowance, { from: owner });
        await expectRevertCustomError(
          this.token.burnFrom(owner, allowance.addn(1), { from: burner }),
          'ERC20InsufficientAllowance',
          [burner, allowance, allowance.addn(1)],
        );
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeERC20Burnable,
};
