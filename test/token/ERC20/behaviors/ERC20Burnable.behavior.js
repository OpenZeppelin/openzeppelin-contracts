const { assertRevert } = require('../../../helpers/assertRevert');
const expectEvent = require('../../../helpers/expectEvent');

const BigNumber = web3.BigNumber;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

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
          const event = expectEvent.inLogs(this.logs, 'Transfer');
          event.args.from.should.equal(owner);
          event.args.to.should.equal(ZERO_ADDRESS);
          event.args.value.should.be.bignumber.equal(amount);
        });
      }
    });

    describe('when the given amount is greater than the balance of the sender', function () {
      const amount = initialBalance + 1;

      it('reverts', async function () {
        await assertRevert(this.token.burn(amount, { from: owner }));
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
          const event = expectEvent.inLogs(this.logs, 'Transfer');
          event.args.from.should.equal(owner);
          event.args.to.should.equal(ZERO_ADDRESS);
          event.args.value.should.be.bignumber.equal(amount);
        });
      }
    });

    describe('when the given amount is greater than the balance of the sender', function () {
      const amount = initialBalance + 1;
      it('reverts', async function () {
        await this.token.approve(burner, amount, { from: owner });
        await assertRevert(this.token.burnFrom(owner, amount, { from: burner }));
      });
    });

    describe('when the given amount is greater than the allowance', function () {
      const amount = 100;
      it('reverts', async function () {
        await this.token.approve(burner, amount - 1, { from: owner });
        await assertRevert(this.token.burnFrom(owner, amount, { from: burner }));
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeERC20Burnable,
};
