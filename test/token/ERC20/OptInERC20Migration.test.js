import assertRevert from '../../helpers/assertRevert';
import shouldBehaveLikeStandardToken from './behaviors/StandardToken.behavior';

const StandardTokenMock = artifacts.require('StandardTokenMock');
const OptInERC20Migration = artifacts.require('OptInERC20Migration');

contract('OptInERC20Migration', function ([_, owner, recipient, anotherAccount]) {
  const BURN_ADDRESS = '0x000000000000000000000000000000000000dead';
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  beforeEach('deploying tokens', async function () {
    this.legacyToken = await StandardTokenMock.new(owner, 200);
    this.token = await OptInERC20Migration.new();
    await this.token.initialize(this.legacyToken.address);
  });

  describe('migrate', function () {
    describe('when the approved balance is higher or equal to the owned balance', function () {
      beforeEach('approving the whole balance to the new contract', async function () {
        this.balanceToBeMigrated = await this.legacyToken.balanceOf(owner);
        await this.legacyToken.approve(this.token.address, this.balanceToBeMigrated, { from: owner });
      });

      beforeEach('migrating tokens', async function () {
        this.receipt = await this.token.migrate({ from: owner });
        assert.equal(this.receipt.logs.length, 2);
      });

      it('mints the same balance of the new token', async function () {
        const currentBalance = await this.token.balanceOf(owner);
        assert(currentBalance.eq(this.balanceToBeMigrated));

        const event = this.receipt.logs[0];
        assert.equal(event.args.from, ZERO_ADDRESS);
        assert.equal(event.args.to, owner);
        assert(event.args.value.eq(this.balanceToBeMigrated));
      });

      it('burns a given amount of old tokens', async function () {
        const currentBurnedBalance = await this.legacyToken.balanceOf(BURN_ADDRESS);
        assert(currentBurnedBalance.eq(this.balanceToBeMigrated));

        const event = this.receipt.logs[1];
        assert.equal(event.args.from, owner);
        assert.equal(event.args.to, BURN_ADDRESS);
        assert(event.args.value.eq(this.balanceToBeMigrated));
      });

      it('updates the total supply', async function () {
        const currentSupply = await this.token.totalSupply();
        assert(currentSupply.eq(this.balanceToBeMigrated));
      });
    });

    describe('when the approved balance is lower than the owned balance', function () {
      beforeEach('approving part of the balance to the new contract', async function () {
        await this.legacyToken.approve(this.token.address, 10, { from: owner });
      });

      it('reverts', async function () {
        await assertRevert(this.token.migrate({ from: owner }));
      });
    });
  });

  describe('migrateToken', function () {
    beforeEach('approving 50 tokens to the new contract', async function () {
      await this.legacyToken.approve(this.token.address, 50, { from: owner });
    });

    describe('when the amount is lower or equal to the one approved', function () {
      const amount = 50;

      beforeEach('migrating tokens', async function () {
        this.receipt = await this.token.migrateToken(amount, { from: owner });
        assert.equal(this.receipt.logs.length, 2);
      });

      it('mints that amount of the new token', async function () {
        const currentBalance = await this.token.balanceOf(owner);
        assert(currentBalance.eq(amount));

        const event = this.receipt.logs[0];
        assert.equal(event.args.from, ZERO_ADDRESS);
        assert.equal(event.args.to, owner);
        assert(event.args.value.eq(amount));
      });

      it('burns a given amount of old tokens', async function () {
        const currentBurnedBalance = await this.legacyToken.balanceOf(BURN_ADDRESS);
        assert(currentBurnedBalance.eq(amount));

        const event = this.receipt.logs[1];
        assert.equal(event.args.from, owner);
        assert.equal(event.args.to, BURN_ADDRESS);
        assert(event.args.value.eq(amount));
      });

      it('updates the total supply', async function () {
        const currentSupply = await this.token.totalSupply();
        assert(currentSupply.eq(amount));
      });
    });

    describe('when the given amount is higher than the one approved', function () {
      const amount = 51;

      it('reverts', async function () {
        await assertRevert(this.token.migrateToken(amount, { from: owner }));
      });
    });
  });

  describe('migrateTokenTo', function () {
    beforeEach('approving 50 tokens to the new contract', async function () {
      await this.legacyToken.approve(this.token.address, 50, { from: owner });
    });

    describe('when the amount is lower or equal to the one approved', function () {
      const amount = 50;

      beforeEach('migrating tokens', async function () {
        this.receipt = await this.token.migrateTokenTo(recipient, amount, { from: owner });
        assert.equal(this.receipt.logs.length, 2);
      });

      it('mints that amount of the new token to the requested recipient', async function () {
        const currentBalance = await this.token.balanceOf(recipient);
        assert(currentBalance.eq(amount));

        const event = this.receipt.logs[0];
        assert.equal(event.args.from, ZERO_ADDRESS);
        assert.equal(event.args.to, recipient);
        assert(event.args.value.eq(amount));
      });

      it('burns a given amount of old tokens', async function () {
        const currentBurnedBalance = await this.legacyToken.balanceOf(BURN_ADDRESS);
        assert(currentBurnedBalance.eq(amount));

        const event = this.receipt.logs[1];
        assert.equal(event.args.from, owner);
        assert.equal(event.args.to, BURN_ADDRESS);
        assert(event.args.value.eq(amount));
      });

      it('updates the total supply', async function () {
        const currentSupply = await this.token.totalSupply();
        assert(currentSupply.eq(amount));
      });
    });

    describe('when the given amount is higher than the one approved', function () {
      const amount = 51;

      it('reverts', async function () {
        await assertRevert(this.token.migrateToken(amount, { from: owner }));
      });
    });
  });

  describe('standard token behavior', function () {
    beforeEach('migrating half balance to new token', async function () {
      await this.legacyToken.approve(this.token.address, 100, { from: owner });
      await this.token.migrateToken(100, { from: owner });
    });

    shouldBehaveLikeStandardToken([owner, recipient, anotherAccount]);
  });
});
