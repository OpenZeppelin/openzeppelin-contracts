const { BN, constants, expectEvent } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');
const { expectRevertCustomError } = require('../../../helpers/customError');

function shouldBehaveLikeERC20Burnable(owner, initialBalance, [burner]) {
  describe('burn', function () {
    describe('when the given value is not greater than balance of the sender', function () {
      context('for a zero value', function () {
        shouldBurn(new BN(0));
      });

      context('for a non-zero value', function () {
        shouldBurn(new BN(100));
      });

      function shouldBurn(value) {
        beforeEach(async function () {
          this.receipt = await this.token.burn(value, { from: owner });
        });

        it('burns the requested value', async function () {
          expect(await this.token.balanceOf(owner)).to.be.bignumber.equal(initialBalance.sub(value));
        });

        it('emits a transfer event', async function () {
          expectEvent(this.receipt, 'Transfer', {
            from: owner,
            to: ZERO_ADDRESS,
            value: value,
          });
        });
      }
    });

    describe('when the given value is greater than the balance of the sender', function () {
      const value = initialBalance.addn(1);

      it('reverts', async function () {
        await expectRevertCustomError(this.token.burn(value, { from: owner }), 'ERC20InsufficientBalance', [
          owner,
          initialBalance,
          value,
        ]);
      });
    });
  });

  describe('burnFrom', function () {
    describe('on success', function () {
      context('for a zero value', function () {
        shouldBurnFrom(new BN(0));
      });

      context('for a non-zero value', function () {
        shouldBurnFrom(new BN(100));
      });

      function shouldBurnFrom(value) {
        const originalAllowance = value.muln(3);

        beforeEach(async function () {
          await this.token.approve(burner, originalAllowance, { from: owner });
          this.receipt = await this.token.burnFrom(owner, value, { from: burner });
        });

        it('burns the requested value', async function () {
          expect(await this.token.balanceOf(owner)).to.be.bignumber.equal(initialBalance.sub(value));
        });

        it('decrements allowance', async function () {
          expect(await this.token.allowance(owner, burner)).to.be.bignumber.equal(originalAllowance.sub(value));
        });

        it('emits a transfer event', async function () {
          expectEvent(this.receipt, 'Transfer', {
            from: owner,
            to: ZERO_ADDRESS,
            value: value,
          });
        });
      }
    });

    describe('when the given value is greater than the balance of the sender', function () {
      const value = initialBalance.addn(1);

      it('reverts', async function () {
        await this.token.approve(burner, value, { from: owner });
        await expectRevertCustomError(this.token.burnFrom(owner, value, { from: burner }), 'ERC20InsufficientBalance', [
          owner,
          initialBalance,
          value,
        ]);
      });
    });

    describe('when the given value is greater than the allowance', function () {
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
