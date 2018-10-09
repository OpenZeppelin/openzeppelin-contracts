const shouldFail = require('../helpers/shouldFail');
const { ZERO_ADDRESS } = require('../helpers/constants');

const ERC20Mock = artifacts.require('ERC20Mock');
const ERC20Mintable = artifacts.require('ERC20Mintable');
const ERC20Migrator = artifacts.require('ERC20Migrator');

const BigNumber = web3.eth.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC20Migrator', function ([_, owner, recipient, anotherAccount]) {
  const totalSupply = 200;

  it('reverts with a null legacy token address', async function () {
    await shouldFail.reverting(ERC20Migrator.new(ZERO_ADDRESS));
  });

  describe('with tokens and migrator', function () {
    beforeEach('deploying tokens and migrator', async function () {
      this.legacyToken = await ERC20Mock.new(owner, totalSupply);
      this.migrator = await ERC20Migrator.new(this.legacyToken.address);
      this.newToken = await ERC20Mintable.new();
    });

    it('returns legacy token', async function () {
      (await this.migrator.legacyToken()).should.be.equal(this.legacyToken.address);
    });

    describe('beginMigration', function () {
      it('reverts with a null new token address', async function () {
        await shouldFail.reverting(this.migrator.beginMigration(ZERO_ADDRESS));
      });

      it('reverts if not a minter of the token', async function () {
        await shouldFail.reverting(this.migrator.beginMigration(this.newToken.address));
      });

      it('succeeds if it is a minter of the token', async function () {
        await this.newToken.addMinter(this.migrator.address);
        await this.migrator.beginMigration(this.newToken.address);
      });

      it('reverts the second time it is called', async function () {
        await this.newToken.addMinter(this.migrator.address);
        await this.migrator.beginMigration(this.newToken.address);
        await shouldFail.reverting(this.migrator.beginMigration(this.newToken.address));
      });
    });

    describe('once migration began', function () {
      beforeEach('beginning migration', async function () {
        await this.newToken.addMinter(this.migrator.address);
        await this.migrator.beginMigration(this.newToken.address);
      });

      it('returns new token', async function () {
        (await this.migrator.newToken()).should.be.equal(this.newToken.address);
      });

      describe('migrateAll', function () {
        const baseAmount = totalSupply;

        describe('when the approved balance is equal to the owned balance', function () {
          const amount = baseAmount;

          beforeEach('approving the whole balance to the new contract', async function () {
            await this.legacyToken.approve(this.migrator.address, amount, { from: owner });
          });

          beforeEach('migrating token', async function () {
            const tx = await this.migrator.migrateAll(owner);
            this.logs = tx.receipt.logs;
          });

          it('mints the same balance of the new token', async function () {
            const currentBalance = await this.newToken.balanceOf(owner);
            currentBalance.should.be.bignumber.equal(amount);
          });

          it('burns a given amount of old tokens', async function () {
            const currentBurnedBalance = await this.legacyToken.balanceOf(this.migrator.address);
            currentBurnedBalance.should.be.bignumber.equal(amount);

            const currentLegacyTokenBalance = await this.legacyToken.balanceOf(owner);
            currentLegacyTokenBalance.should.be.bignumber.equal(0);
          });

          it('updates the total supply', async function () {
            const currentSupply = await this.newToken.totalSupply();
            currentSupply.should.be.bignumber.equal(amount);
          });
        });

        describe('when the approved balance is lower than the owned balance', function () {
          const amount = baseAmount - 1;

          beforeEach('approving part of the balance to the new contract', async function () {
            await this.legacyToken.approve(this.migrator.address, amount, { from: owner });
            await this.migrator.migrateAll(owner);
          });

          it('migrates only approved amount', async function () {
            const currentBalance = await this.newToken.balanceOf(owner);
            currentBalance.should.be.bignumber.equal(amount);
          });
        });
      });

      describe('migrate', function () {
        const baseAmount = 50;

        beforeEach('approving tokens to the new contract', async function () {
          await this.legacyToken.approve(this.migrator.address, baseAmount, { from: owner });
        });

        describe('when the amount is equal to the one approved', function () {
          const amount = baseAmount;

          beforeEach('migrate token', async function () {
            ({ logs: this.logs } = await this.migrator.migrate(owner, amount));
          });

          it('mints that amount of the new token', async function () {
            const currentBalance = await this.newToken.balanceOf(owner);
            currentBalance.should.be.bignumber.equal(amount);
          });

          it('burns a given amount of old tokens', async function () {
            const currentBurnedBalance = await this.legacyToken.balanceOf(this.migrator.address);
            currentBurnedBalance.should.be.bignumber.equal(amount);

            const currentLegacyTokenBalance = await this.legacyToken.balanceOf(owner);
            currentLegacyTokenBalance.should.be.bignumber.equal(totalSupply - amount);
          });

          it('updates the total supply', async function () {
            const currentSupply = await this.newToken.totalSupply();
            currentSupply.should.be.bignumber.equal(amount);
          });
        });

        describe('when the given amount is higher than the one approved', function () {
          const amount = baseAmount + 1;

          it('reverts', async function () {
            await shouldFail.reverting(this.migrator.migrate(owner, amount));
          });
        });
      });
    });
  });
});
