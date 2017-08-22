'use strict';
import expectThrow from './helpers/expectThrow';
import toPromise from './helpers/toPromise';
const Multiplexer = artifacts.require('../contracts/lifecycle/HasNoEther.sol');
const MultiplexTarget = artifacts.require('./helpers/MultiplexTarget.sol');

contract('Multiplexer', function(accounts) {
   let multiplexer;
   let target;

   beforeEach(async function() {
      target = await MultiplexTarget.new();
      multiplexer = await Multiplexer.new(target, [accounts[1], accounts[2]]);
   });

   it('should be take target and managers from contructor', async function() {
      let targetQuery = await multiplexer.multiplexTarget();
      assert.equals(target, targetQuery);
      assert.isTrue(await multiplexer.multiplexIsManager(accounts[1]));
      assert.isTrue(await multiplexer.multiplexIsManager(accounts[2]));
   });

   it('should allow forward for managers', async function() {});

   it('should not forward for non-managers', async function() {});

   it('should multiplex a role', async function() {});

   it('should list managers', async function() {});

   it('should query managers', async function() {
      assert.isFalse(await multiplexer.multiplexIsManager(accounts[0]));
      assert.isTrue(await multiplexer.multiplexIsManager(accounts[1]));
      assert.isTrue(await multiplexer.multiplexIsManager(accounts[2]));
      assert.isFalse(await multiplexer.multiplexIsManager(accounts[3]));
   });

   it('should add managers', async function() {
      assert.isFalse(await multiplexer.multiplexIsManager(accounts[3]));
      await multiplexer.multiplexAddManager(accounts[3]);
      assert.isTrue(await multiplexer.multiplexIsManager(accounts[3]));
   });

   it('should remove managers', async function() {
      assert.isTrue(await multiplexer.multiplexIsManager(accounts[2]));
      await multiplexer.multiplexRemoveManager(accounts[2]);
      assert.isFalse(await multiplexer.multiplexIsManager(accounts[2]));
   });
});
