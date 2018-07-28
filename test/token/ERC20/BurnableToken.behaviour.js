const { assertRevert } = require('../../helpers/assertRevert');
const { inLogs } = require('../../helpers/expectEvent');

const BigNumber = web3.BigNumber;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeBurnableToken ([owner], initialBalance) {
  describe('as a basic burnable token', function () {
    const from = owner;

    describe('when the given amount is not greater than balance of the sender', function () {
      const amount = 100;

      beforeEach(async function () {
        ({ logs: this.logs } = await this.token.burn(amount, { from }));
      });

      it('burns the requested amount', async function () {
        const balance = await this.token.balanceOf(from);
        balance.should.be.bignumber.equal(initialBalance - amount);
      });

      it('emits a burn event', async function () {
        const event = await inLogs(this.logs, 'Burn');
        event.args.burner.should.eq(owner);
        event.args.value.should.be.bignumber.equal(amount);
      });

      it('emits a transfer event', async function () {
        const event = await inLogs(this.logs, 'Transfer');
        event.args.from.should.eq(owner);
        event.args.to.should.eq(ZERO_ADDRESS);
        event.args.value.should.be.bignumber.equal(amount);
      });
    });

    describe('when the given amount is greater than the balance of the sender', function () {
      const amount = initialBalance + 1;

      it('reverts', async function () {
        await assertRevert(this.token.burn(amount, { from }));
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeBurnableToken,
};
