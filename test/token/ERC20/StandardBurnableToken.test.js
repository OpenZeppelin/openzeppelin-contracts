const { assertRevert } = require('../../helpers/assertRevert');
const { inLogs } = require('../../helpers/expectEvent');
const { shouldBehaveLikeBurnableToken } = require('./BurnableToken.behaviour');

const StandardBurnableTokenMock = artifacts.require('StandardBurnableTokenMock');
const BigNumber = web3.BigNumber;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('StandardBurnableToken', function ([owner, burner]) {
  const initialBalance = 1000;

  beforeEach(async function () {
    this.token = await StandardBurnableTokenMock.new(owner, initialBalance);
  });

  shouldBehaveLikeBurnableToken([owner], initialBalance);

  describe('burnFrom', function () {
    describe('on success', function () {
      const amount = 100;

      beforeEach(async function () {
        await this.token.approve(burner, 300, { from: owner });
        const { logs } = await this.token.burnFrom(owner, amount, { from: burner });
        this.logs = logs;
      });

      it('burns the requested amount', async function () {
        const balance = await this.token.balanceOf(owner);
        balance.should.be.bignumber.equal(initialBalance - amount);
      });

      it('decrements allowance', async function () {
        const allowance = await this.token.allowance(owner, burner);
        allowance.should.be.bignumber.equal(200);
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
});
