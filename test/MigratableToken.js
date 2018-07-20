'use strict';
import expectThrow from './helpers/expectThrow';

const MigratableTokenMock = artifacts.require('./MigratableTokenMock.sol');
const MigrationTargetExample = artifacts.require('./helpers/MigrationTargetExample.sol');

contract('MigratableToken', function(accounts) {
  let migratableToken;
  let newToken;

  describe("Migration setup", async function(){
    beforeEach(async function(){
      migratableToken = await MigratableTokenMock.new(accounts[2], 500);
      newToken = await MigrationTargetExample.new();
    });

    it('should allow owner to set migration target', async function() {
      await migratableToken.setMigrationTarget(newToken.address);
      const migrationTokenAddress = await migratableToken.migrationTarget();
      assert.equal(newToken.address, migrationTokenAddress);

      // should throw while setting address again
      const newToken2 = await MigrationTargetExample.new();
      expectThrow(migratableToken.setMigrationTarget(newToken2.address));
    });

    it('should not allow other than owner to set migration target', async function() {
      expectThrow(migratableToken.setMigrationTarget(newToken.address, {from: accounts[1]}));

      const migrationTokenAddress = await migratableToken.migrationTarget();
      assert.equal(migrationTokenAddress, 0x0);
    });

    it('should not allow to migrate before allowed time', async function() {
      await migratableToken.setMigrationTarget(newToken.address);
      await newToken.setSourceToken(migratableToken.address);

      // try to migrate before starting migration should throw error
      expectThrow(migratableToken.migrate(500, {from: accounts[2]}));
    });
  });

  describe("Start migration", async function(){
    before(async function(){
      migratableToken = await MigratableTokenMock.new(accounts[2], 500);
      newToken = await MigrationTargetExample.new();

      await migratableToken.setMigrationTarget(newToken.address);
      await newToken.setSourceToken(migratableToken.address);
    });

    it('should allow to start migration', async function() {
      let startReceipt = await migratableToken.startMigration();
      assert.equal(startReceipt.logs.length, 1);
      assert.equal(startReceipt.logs[0].event, 'StartMigration');

      const isMigrating = await migratableToken.migrating();
      assert.isTrue(isMigrating);
    });

    it('should not allow to start migration while already migrating', async function() {
      expectThrow(migratableToken.startMigration());
    });

    it('should allow user to migrate', async function() {
      let totalSupply = await migratableToken.totalSupply();
      assert.equal(totalSupply, 500);

      let balance = await migratableToken.balanceOf(accounts[2]);
      assert.equal(balance, 500);

      // migrate
      let migrationReceipt = await migratableToken.migrate(500, {from: accounts[2]});
      assert.equal(migrationReceipt.logs.length, 1);

      let migrateEvent = migrationReceipt.logs[0];
      assert.equal(migrateEvent.event, 'Migrate');
      assert.equal(migrateEvent.args._from, accounts[2]);
      assert.equal(migrateEvent.args._to, newToken.address);
      assert.equal(migrateEvent.args._value, 500);

      totalSupply = await migratableToken.totalSupply();
      assert.equal(totalSupply, 0);

      balance = await migratableToken.balanceOf(accounts[2]);
      assert.equal(balance, 0);

      totalSupply = await newToken.totalSupply();
      assert.equal(totalSupply, 500);

      balance = await newToken.balanceOf(accounts[2]);
      assert.equal(balance, 500);
    });

    it('should throw error if user is not investor', async function() {
      expectThrow(migratableToken.migrate(250, {from: accounts[2]}));
    });
  });

  describe("Stop migration", async function(){
    before(async function(){
      migratableToken = await MigratableTokenMock.new(accounts[2], 500);
      newToken = await MigrationTargetExample.new();

      await migratableToken.setMigrationTarget(newToken.address);
      await newToken.setSourceToken(migratableToken.address);
      await migratableToken.startMigration();
      await migratableToken.migrate(250, {from: accounts[2]});

      let totalSupply = await newToken.totalSupply();
      assert.equal(totalSupply, 250);

      let balance = await newToken.balanceOf(accounts[2]);
      assert.equal(balance, 250);
    });

    it('should allow to stop migration', async function() {
      let stopReceipt = await migratableToken.stopMigration();
      assert.equal(stopReceipt.logs.length, 1);
      assert.equal(stopReceipt.logs[0].event, 'StopMigration');

      const isMigrating = await migratableToken.migrating();
      assert.isFalse(isMigrating);
    });

    it('should not allow to migrate once it stopped', async function() {
      expectThrow(migratableToken.migrate(250, {from: accounts[2]}));

      let totalSupply = await migratableToken.totalSupply();
      assert.equal(totalSupply, 250);

      let balance = await migratableToken.balanceOf(accounts[2]);
      assert.equal(balance, 250);

      totalSupply = await newToken.totalSupply();
      assert.equal(totalSupply, 250);

      balance = await newToken.balanceOf(accounts[2]);
      assert.equal(balance, 250);
    });
  });

});
