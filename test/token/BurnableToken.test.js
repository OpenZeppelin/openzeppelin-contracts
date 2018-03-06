import assertRevert from '../helpers/assertRevert';
const BurnableTokenMock = artifacts.require('BurnableTokenMock');

contract('BurnableToken', function ([owner, anotherAccount]) {
  beforeEach(async function () {
    this.token = await BurnableTokenMock.new(owner, 1000);
  });

  describe('burn', function () {
    const from = owner;

    describe('when the given amount is not greater than balance of the burn address', function () {
      const amount = 100;

      it('burns the requested amount from the owner', async function () {
        await this.token.burn(owner, amount, { from });

        const balance = await this.token.balanceOf(from);
        assert.equal(balance, 900);

        const totalSupply = await this.token.totalSupply();
        assert.equal(totalSupply, 900);
      });

      it('burns the requested amount from another account', async function () {
        await this.token.transfer(anotherAccount, amount, { from: owner });
        await this.token.burn(anotherAccount, 10, { from });
        const balance = await this.token.balanceOf(anotherAccount);
        assert.equal(balance, 90);

        const totalSupply = await this.token.totalSupply();
        assert.equal(totalSupply, 990);
      });

      it('emits a burn event', async function () {
        const { logs } = await this.token.burn(owner, amount, { from });
        const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
        assert.equal(logs.length, 2);
        assert.equal(logs[0].event, 'Burn');
        assert.equal(logs[0].args.from, owner);
        assert.equal(logs[0].args.amount, amount);

        assert.equal(logs[1].event, 'Transfer');
        assert.equal(logs[1].args.from, owner);
        assert.equal(logs[1].args.to, ZERO_ADDRESS);
        assert.equal(logs[1].args.value, amount);
      });
    });

    describe('when the given amount is greater than the balance of the burn address', function () {
      const amount = 1001;

      it('reverts', async function () {
        await assertRevert(this.token.burn(owner, amount, { from }));

        const totalSupply = await this.token.totalSupply();
        assert.equal(totalSupply, 1000);
      });

      it('reverts', async function () {
        await assertRevert(this.token.burn(anotherAccount, amount, { from }));
      });
    });

    describe('when the caller is not the owner', function () {
      const amount = 100;

      it('reverts', async function () {
        await assertRevert(this.token.burn(owner, amount, { from: anotherAccount }));
      });

      it('reverts', async function () {
        await this.token.transfer(anotherAccount, amount, { from: owner });
        await assertRevert(this.token.burn(anotherAccount, 10, { from: anotherAccount }));

        const totalSupply = await this.token.totalSupply();
        assert.equal(totalSupply, 1000);
      });
    });
  });
});
