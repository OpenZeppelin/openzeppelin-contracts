const shouldFail = require('../../../helpers/shouldFail');
const expectEvent = require('../../../helpers/expectEvent');
const { ZERO_ADDRESS } = require('../../../helpers/constants');

require('../../../helpers/setup');

function shouldBehaveLikeERC20Burnable (owner, initialBalance, [burner]) {
  describe('burn', function () {
    describe('when the given amount is not greater than balance of the sender', function () {
      context('for a zero amount', function () {
        shouldBurn(0);
      });

      context('for a non-zero amount', function () {
        shouldBurn(100);
      });

      function shouldBurn (amount) {
        beforeEach(async function () {
          ({ logs: this.logs } = await this.token.burn(amount, { from: owner }));
        });

        it('burns the requested amount', async function () {
          (await this.token.balanceOf(owner)).should.be.bignumber.equal(initialBalance - amount);
        });

        it('emits a transfer event', async function () {
          expectEvent.inLogs(this.logs, 'Transfer', {
            from: owner,
            to: ZERO_ADDRESS,
            value: amount,
          });
        });
      }
    });

    describe('when the given amount is greater than the balance of the sender', function () {
      const amount = initialBalance + 1;

      it('reverts', async function () {
        await shouldFail.reverting(this.token.burn(amount, { from: owner }));
      });
    });
  });

  describe('burnFrom', function () {
    describe('on success', function () {
      context('for a zero amount', function () {
        shouldBurnFrom(0);
      });

      context('for a non-zero amount', function () {
        shouldBurnFrom(100);
      });

      function shouldBurnFrom (amount) {
        const originalAllowance = amount * 3;

        beforeEach(async function () {
          await this.token.approve(burner, originalAllowance, { from: owner });
          const { logs } = await this.token.burnFrom(owner, amount, { from: burner });
          this.logs = logs;
        });

        it('burns the requested amount', async function () {
          (await this.token.balanceOf(owner)).should.be.bignumber.equal(initialBalance - amount);
        });

        it('decrements allowance', async function () {
          (await this.token.allowance(owner, burner)).should.be.bignumber.equal(originalAllowance - amount);
        });

        it('emits a transfer event', async function () {
          expectEvent.inLogs(this.logs, 'Transfer', {
            from: owner,
            to: ZERO_ADDRESS,
            value: amount,
          });
        });
      }
    });

    describe('when the given amount is greater than the balance of the sender', function () {
      const amount = initialBalance + 1;
      it('reverts', async function () {
        await this.token.approve(burner, amount, { from: owner });
        await shouldFail.reverting(this.token.burnFrom(owner, amount, { from: burner }));
      });
    });

    describe('when the given amount is greater than the allowance', function () {
      const amount = 100;
      it('reverts', async function () {
        await this.token.approve(burner, amount - 1, { from: owner });
        await shouldFail.reverting(this.token.burnFrom(owner, amount, { from: burner }));
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeERC20Burnable,
};
