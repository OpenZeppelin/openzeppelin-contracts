const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, constants, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const ERC20Mock = contract.fromArtifact('ERC20Mock');
const ERC20Mintable = contract.fromArtifact('ERC20Mintable');
const ERC20Migrator = contract.fromArtifact('ERC20Migrator');

describe('ERC20Migrator', function () {
  const [ owner ] = accounts;

  const totalSupply = new BN('200');

  it('reverts with a null legacy token address', async function () {
    await expectRevert(ERC20Migrator.new(ZERO_ADDRESS),
      'ERC20Migrator: legacy token is the zero address'
    );
  });

  describe('with tokens and migrator', function () {
    beforeEach('deploying tokens and migrator', async function () {
      this.legacyToken = await ERC20Mock.new(owner, totalSupply);
      this.migrator = await ERC20Migrator.new(this.legacyToken.address);
      this.newToken = await ERC20Mintable.new();
    });

    it('returns legacy token', async function () {
      expect(await this.migrator.legacyToken()).to.equal(this.legacyToken.address);
    });

    describe('beginMigration', function () {
      it('reverts with a null new token address', async function () {
        await expectRevert(this.migrator.beginMigration(ZERO_ADDRESS),
          'ERC20Migrator: new token is the zero address'
        );
      });

      it('reverts if not a minter of the token', async function () {
        await expectRevert(this.migrator.beginMigration(this.newToken.address),
          'ERC20Migrator: not a minter for new token'
        );
      });

      it('succeeds if it is a minter of the token', async function () {
        await this.newToken.addMinter(this.migrator.address);
        await this.migrator.beginMigration(this.newToken.address);
      });

      it('reverts the second time it is called', async function () {
        await this.newToken.addMinter(this.migrator.address);
        await this.migrator.beginMigration(this.newToken.address);
        await expectRevert(this.migrator.beginMigration(this.newToken.address),
          'ERC20Migrator: migration already started'
        );
      });
    });

    context('before starting the migration', function () {
      it('returns the zero address for the new token', async function () {
        expect(await this.migrator.newToken()).to.equal(ZERO_ADDRESS);
      });

      describe('migrateAll', function () {
        const amount = totalSupply;

        describe('when the approved balance is equal to the owned balance', function () {
          beforeEach('approving the whole balance to the new contract', async function () {
            await this.legacyToken.approve(this.migrator.address, amount, { from: owner });
          });

          it('reverts', async function () {
            await expectRevert(this.migrator.migrateAll(owner),
              'ERC20Migrator: migration not started'
            );
          });
        });
      });

      describe('migrate', function () {
        const amount = new BN(50);

        describe('when the amount is equal to the approved value', function () {
          beforeEach('approving tokens to the new contract', async function () {
            await this.legacyToken.approve(this.migrator.address, amount, { from: owner });
          });

          it('reverts', async function () {
            await expectRevert(this.migrator.migrate(owner, amount),
              'ERC20Migrator: migration not started'
            );
          });
        });
      });
    });

    describe('once migration began', function () {
      beforeEach('beginning migration', async function () {
        await this.newToken.addMinter(this.migrator.address);
        await this.migrator.beginMigration(this.newToken.address);
      });

      it('returns new token', async function () {
        expect(await this.migrator.newToken()).to.equal(this.newToken.address);
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
            expect(currentBalance).to.be.bignumber.equal(amount);
          });

          it('burns a given amount of old tokens', async function () {
            const currentBurnedBalance = await this.legacyToken.balanceOf(this.migrator.address);
            expect(currentBurnedBalance).to.be.bignumber.equal(amount);

            const currentLegacyTokenBalance = await this.legacyToken.balanceOf(owner);
            expect(currentLegacyTokenBalance).to.be.bignumber.equal('0');
          });

          it('updates the total supply', async function () {
            const currentSupply = await this.newToken.totalSupply();
            expect(currentSupply).to.be.bignumber.equal(amount);
          });
        });

        describe('when the approved balance is lower than the owned balance', function () {
          const amount = baseAmount.subn(1);

          beforeEach('approving part of the balance to the new contract', async function () {
            await this.legacyToken.approve(this.migrator.address, amount, { from: owner });
            await this.migrator.migrateAll(owner);
          });

          it('migrates only approved amount', async function () {
            const currentBalance = await this.newToken.balanceOf(owner);
            expect(currentBalance).to.be.bignumber.equal(amount);
          });
        });
      });

      describe('migrate', function () {
        const baseAmount = new BN(50);

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
            expect(currentBalance).to.be.bignumber.equal(amount);
          });

          it('burns a given amount of old tokens', async function () {
            const currentBurnedBalance = await this.legacyToken.balanceOf(this.migrator.address);
            expect(currentBurnedBalance).to.be.bignumber.equal(amount);

            const currentLegacyTokenBalance = await this.legacyToken.balanceOf(owner);
            expect(currentLegacyTokenBalance).to.be.bignumber.equal(totalSupply.sub(amount));
          });

          it('updates the total supply', async function () {
            const currentSupply = await this.newToken.totalSupply();
            expect(currentSupply).to.be.bignumber.equal(amount);
          });
        });

        describe('when the given amount is higher than the one approved', function () {
          const amount = baseAmount.addn(1);

          it('reverts', async function () {
            await expectRevert(this.migrator.migrate(owner, amount),
              'SafeERC20: low-level call failed'
            );
          });
        });
      });
    });
  });
});
