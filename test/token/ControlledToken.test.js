import assertRevert from '../helpers/assertRevert';
const ControlledTokenMock = artifacts.require('ControlledTokenMock');

contract('ControlledToken', function ([owner, anotherAccount]) {
  const from = owner;
  const totalSupply = 1000;
  const amount = 100;

  beforeEach(async function () {
    this.token = await ControlledTokenMock.new(owner, totalSupply);
  });

  describe('burn', function () {
    describe('when the given amount is not greater than balance of the burn address', function () {
      it('burns the requested amount from the owner', async function () {
        await this.token.burn(owner, amount, { from });

        const balance = await this.token.balanceOf(from);
        assert.equal(balance, totalSupply - amount);

        const _totalSupply = await this.token.totalSupply();
        assert.equal(_totalSupply, totalSupply - amount);
      });

      it('burns the requested amount from another account', async function () {
        await this.token.transfer(anotherAccount, amount, { from: owner });
        await this.token.burn(anotherAccount, 10, { from });
        const balance = await this.token.balanceOf(anotherAccount);
        assert.equal(balance, amount - 10);

        const _totalSupply = await this.token.totalSupply();
        assert.equal(_totalSupply, totalSupply - 10);
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
      it('reverts', async function () {
        await assertRevert(this.token.burn(owner, totalSupply + 1, { from }));

        const _totalSupply = await this.token.totalSupply();
        assert.equal(_totalSupply, totalSupply);
      });

      it('reverts', async function () {
        await assertRevert(this.token.burn(anotherAccount, amount, { from }));
      });
    });

    describe('when the caller is not the owner', function () {
      it('reverts', async function () {
        await assertRevert(this.token.burn(owner, amount, { from: anotherAccount }));
      });

      it('reverts', async function () {
        await this.token.transfer(anotherAccount, amount, { from: owner });
        await assertRevert(this.token.burn(anotherAccount, 10, { from: anotherAccount }));

        const _totalSupply = await this.token.totalSupply();
        assert.equal(_totalSupply, totalSupply);
      });
    });
  });

  describe('mint', function () {
    describe('when the contract owner mints tokens', function () {
      it('mints the requested amount to the owner', async function () {
        await this.token.mint(owner, amount, { from });

        const balance = await this.token.balanceOf(from);
        assert.equal(balance, totalSupply + amount);

        const _totalSupply = await this.token.totalSupply();
        assert.equal(_totalSupply, totalSupply + amount);
      });

      it('mints the requested amount to another account', async function () {
        await this.token.mint(anotherAccount, amount, { from });
        const balance = await this.token.balanceOf(anotherAccount);
        assert.equal(balance, amount);

        const _totalSupply = await this.token.totalSupply();
        assert.equal(_totalSupply, totalSupply + amount);
      });

      it('emits a mint event', async function () {
        const { logs } = await this.token.mint(owner, amount, { from });
        assert.equal(logs.length, 2);
        assert.equal(logs[0].event, 'Mint');
        assert.equal(logs[0].args.to, owner);
        assert.equal(logs[0].args.amount, amount);

        assert.equal(logs[1].event, 'Transfer');
        assert.equal(logs[1].args.from, 0);
        assert.equal(logs[1].args.to, owner);
        assert.equal(logs[1].args.value, amount);
      });
    });

    describe('when another account tries to mint tokens', function () {
      it('reverts', async function () {
        await assertRevert(this.token.mint(owner, amount, { from: anotherAccount }));

        const _totalSupply = await this.token.totalSupply();
        assert.equal(_totalSupply, totalSupply);
      });

      it('reverts', async function () {
        await assertRevert(this.token.mint(anotherAccount, amount, { from: anotherAccount }));

        const _totalSupply = await this.token.totalSupply();
        assert.equal(_totalSupply, totalSupply);
      });
    });
  });
});
