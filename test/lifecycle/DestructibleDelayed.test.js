
import expectEvent from '../helpers/expectEvent';
import expectThrow from '../helpers/expectThrow';

const BigNumber = web3.BigNumber;

var DestructibleDelayedMock = artifacts.require('DestructibleDelayedMock');
require('../helpers/transactionMined.js');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const twoWeeks = 2* 7 * 24 * 60 * 60; //In seconds

contract('DestructibleDelayed', function ([owner, anyone]) {
  let destructibleDelayed;

  describe('Destruction requests', function () {
    beforeEach(async function () {
      destructibleDelayed = await DestructibleDelayedMock.new(
        twoWeeks, { from: owner, value: web3.toWei('10', 'ether') }
      );
    });

    it('owner should be able to create a destroyRequest', async function () {
      await expectEvent.inTransaction(
        destructibleDelayed.destroyRequest({ from: owner }),
        'SelfDestructionRequest'
      );

      const destructionRequested = await destructibleDelayed.destructionRequested();

      destructionRequested.should.be.equal(true);
    });

    it('anyone should not be able to create a destroy request', async function () {
      await expectThrow(
        destructibleDelayed.destroyRequest({ from: anyone })
      );
    });
    
    context('once destruction requested,', function () {
      var block;
      var tx;

      beforeEach(async function () {
        tx = await destructibleDelayed.destroyRequest({ from: owner });
        block = await web3.eth.getBlock(tx.receipt.blockNumber);
      });

      it('destruction time should be set to block.timestamp + destruction_delay', async function () {
        const destructionTime = await destructibleDelayed.destructionTime();
        const destructionDelay = await destructibleDelayed.SELFDESTRUCTION_DELAY();

        destructionTime.should.be.bignumber.equal(
          destructionDelay.plus(block.timestamp)
        );
      });

      it('should not allow a new #destroyRequest call', async function () {
        await expectThrow(
          destructibleDelayed.destroyRequest({ from: owner })
        );
      });

      it('destroyRequest can be cancelled by owner', async function () {
        await expectEvent.inTransaction(
          destructibleDelayed.cancelDestroyRequest({ from: owner }),
          'SelfDestructionRequestCancelled'
        );

        const destructionRequested = await destructibleDelayed.destructionRequested();

        destructionRequested.should.be.equal(false);
      });

      it('anyone should not be able to cancel a destroy request', async function () {
        await expectThrow(
          destructibleDelayed.cancelDestroyRequest({ from: anyone })
        );
      });

      it('should not allow to call #destroy before delay is passed', async function () {
        await expectThrow(
          destructibleDelayed.destroyRequest({ from: owner })
        );
      });

      context('once destructionTime is passed', function () {
        beforeEach(async function () {
          await web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            params: [twoWeeks + 1], // 2 weeks + 1 second
            id: 0,
          });
        });

        it('should allow #destroy after delay is passed', async function () {
          await destructibleDelayed.destroy(owner, { from: owner }).should.be.fulfilled;
        });

        it('should not allow anyone to call #destroy after delay is passed', async function () {
          await destructibleDelayed.destroy(anyone, { from: anyone }).should.be.rejected;
        });

        it('should send balance to owner after destruction', async function () {
          let initBalance = await web3.eth.getBalance(owner);
          await destructibleDelayed.destroy(owner, { from: owner });
          let newBalance = await web3.eth.getBalance(owner);

          newBalance.should.be.bignumber.greaterThan(initBalance)
        });

        it('should send balance to anyone after destruction', async function () {
          let initBalance = await web3.eth.getBalance(anyone);
          await destructibleDelayed.destroy(anyone, { from: owner });
          let newBalance = await web3.eth.getBalance(anyone);

          newBalance.should.be.bignumber.greaterThan(initBalance);
        });
      });
    });
  });
});
