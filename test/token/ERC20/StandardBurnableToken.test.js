import assertRevert from '../../helpers/assertRevert';
import shouldBehaveLikeBurnableToken from './BurnableToken.behaviour';
const StandardBurnableTokenMock = artifacts.require('StandardBurnableTokenMock');

contract('StandardBurnableToken', function ([owner, burner]) {
  beforeEach(async function () {
    this.token = await StandardBurnableTokenMock.new(owner, 1000);
  });

  shouldBehaveLikeBurnableToken([owner]);

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
        assert.equal(balance, 900);
      });

      it('decrements allowance', async function () {
        const allowance = await this.token.allowance(owner, burner);
        assert.equal(allowance, 200);
      });

      it('emits a burn event', async function () {
        const logs = this.logs;
        const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
        assert.equal(logs.length, 2);
        assert.equal(logs[0].event, 'Burn');
        assert.equal(logs[0].args.burner, owner);
        assert.equal(logs[0].args.value, amount);

        assert.equal(logs[1].event, 'Transfer');
        assert.equal(logs[1].args.from, owner);
        assert.equal(logs[1].args.to, ZERO_ADDRESS);
        assert.equal(logs[1].args.value, amount);
      });
    });

    describe('when the given amount is greater than the balance of the sender', function () {
      const amount = 1001;
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
