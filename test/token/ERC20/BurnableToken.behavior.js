const { assertRevert } = require('../../helpers/assertRevert');
const expectEvent = require('../../helpers/expectEvent');

const BigNumber = web3.BigNumber;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeBurnableToken (owner, initialBalance, [burner]) {
  describe('burn', function () {
    describe('when the given amount is not greater than balance of the sender', function () {
      const amount = 100;

      beforeEach(async function () {
        ({ logs: this.logs } = await this.token.burn(amount, { from: owner }));
      });

      it('burns the requested amount', async function () {
        (await this.token.balanceOf(owner)).should.be.bignumber.equal(initialBalance - amount);
      });

      it('emits a burn event', async function () {
        const event = expectEvent.inLogs(this.logs, 'Burn');
        event.args.burner.should.eq(owner);
        event.args.value.should.be.bignumber.equal(amount);
      });

      it('emits a transfer event', async function () {
        const event = expectEvent.inLogs(this.logs, 'Transfer');
        event.args.from.should.eq(owner);
        event.args.to.should.eq(ZERO_ADDRESS);
        event.args.value.should.be.bignumber.equal(amount);
      });
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
      const amount = 100;

      beforeEach(async function () {
        await this.token.approve(burner, 300, { from: owner });
        const { logs } = await this.token.burnFrom(owner, amount, { from: burner });
        this.logs = logs;
      });

      it('burns the requested amount', async function () {
        (await this.token.balanceOf(owner)).should.be.bignumber.equal(initialBalance - amount);
      });

      it('decrements allowance', async function () {
        (await this.token.allowance(owner, burner)).should.be.bignumber.equal(200);
      });

      it('emits a burn event', async function () {
        const event = expectEvent.inLogs(this.logs, 'Burn');
        event.args.burner.should.eq(owner);
        event.args.value.should.be.bignumber.equal(amount);
      });

      it('emits a transfer event', async function () {
        const event = expectEvent.inLogs(this.logs, 'Transfer');
        event.args.from.should.eq(owner);
        event.args.to.should.eq(ZERO_ADDRESS);
        event.args.value.should.be.bignumber.equal(amount);
      });
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
  shouldBehaveLikeBurnableToken,
};
