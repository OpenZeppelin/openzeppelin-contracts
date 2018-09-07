const { assertRevert } = require('../../helpers/assertRevert');
const expectEvent = require('../../helpers/expectEvent');

const ERC20Mock = artifacts.require('ERC20Mock');
const ERC20Mintable = artifacts.require('ERC20Mintable');
const ERC20Migrator = artifacts.require('ERC20Migrator');

const BigNumber = web3.eth.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract.only('ERC20Migrator', function ([_, owner, recipient, anotherAccount]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  const totalSupply = 200;

  beforeEach('deploying tokens', async function () {
    this.legacyToken = await ERC20Mock.new(owner, totalSupply);
    this.migrator = await ERC20Migrator.new(this.legacyToken.address);
    this.newToken = await ERC20Mintable.new();
    await this.migrator.beginMigration(this.newToken.address);
  });

  describe('migrateAll', function () {
    const baseAmount = totalSupply;

    describe('when the approved balance is higher or equal to the owned balance', function () {
      const amount = baseAmount;

      beforeEach('approving the whole balance to the new contract', async function () {
        await this.legacyToken.approve(this.migrator.address, amount, { from: owner });
      });

      beforeEach('migrating token', async function () {
        ({ logs: this.logs } = await this.migrator.migrateAll(owner));
      });

      it('mints the same balance of the new token', async function () {
        const currentBalance = await this.newToken.balanceOf(owner);
        currentBalance.should.be.bignumber.equal(amount);

        const event = expectEvent.inLogs(this.logs, 'Transfer', {
          from: ZERO_ADDRESS,
          to: owner,
        });
        event.args.value.should.be.bignumber.equal(amount);
      });

      it('burns a given amount of old tokens', async function () {
        const currentBurnedBalance = await this.legacyToken.balanceOf(this.migrator.address);
        currentBurnedBalance.should.be.bignumber.equal(amount);

        const currentLegacyTokenBalance = await this.legacyToken.balanceOf(owner);
        currentLegacyTokenBalance.should.be.bignumber.equal(0);
      });

      it('updates the total supply', async function () {
        const currentSupply = await this.newToken.totalSupply();
        currentSupply.should.be.bignumbe.equal(amount);
      });
    });

    describe('when the approved balance is lower than the owned balance', function () {
      const amount = baseAmount - 1;

      beforeEach('approving part of the balance to the new contract', async function () {
        await this.legacyToken.approve(this.migrator.address, amount, { from: owner });
      });

      it('reverts', async function () {
        await assertRevert(this.newToken.migrateAll(owner));
      });
    });
  });

  describe('migrate', function () {
    const baseAmount = 50

    beforeEach('approving tokens to the new contract', async function () {
      await this.legacyToken.approve(this.migrator.address, baseAmount, { from: owner });
    });

    describe('when the amount is lower or equal to the one approved', function () {
      const amount = baseAmount;

      beforeEach('migrate token', async function () {
        ({ logs: this.logs } = await this.migrator.migrate(owner));
      });

      it('mints that amount of the new token', async function () {
        const currentBalance = await this.newToken.balanceOf(owner);
        currentBalance.should.be.bignumber.equal(amount);

        const event = expectEvent.inLogs(this.logs, 'Transfer', {
          from: ZERO_ADDRESS,
          to: owner,
        });
        event.args.value.should.be.bignumber.equal(amount);
      });

      it('burns a given amount of old tokens', async function () {
        const currentBurnedBalance = await this.legacyToken.balanceOf(this.migrator.address);
        currentBurnedBalance.should.be.bignumber.equal(amount);

        const currentLegacyTokenBalance = await this.legacyToken.balanceOf(owner);
        currentLegacyTokenBalance.should.be.bignumber.equal(0);
      });

      it('updates the total supply', async function () {
        const currentSupply = await this.newToken.totalSupply();
        currentSupply.should.be.bignumbe.equal(amount);
      });
    });

    describe('when the given amount is higher than the one approved', function () {
      const amount = baseAmount + 1;

      it('reverts', async function () {
        await assertRevert(this.newToken.migrate(owner, amount));
      });
    });
  });
});
