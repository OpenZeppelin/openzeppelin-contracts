const { expectRevert, time } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const { batchInBlock } = require('../helpers/txpool');

const $Checkpoints = artifacts.require('$Checkpoints');

const first = (array) => array.length ? array[0] : undefined;
const last = (array) => array.length ? array[array.length - 1] : undefined;

contract('Checkpoints', function (accounts) {
  beforeEach(async function () {
    this.mock = await $Checkpoints.new();
  });

  describe('History checkpoints', function () {
    const fnLatest = (self, ...args) =>
      self.methods['$latest_Checkpoints_History(uint256)'](0, ...args);
    const fnLatestCheckpoint = (self, ...args) =>
      self.methods['$latestCheckpoint_Checkpoints_History(uint256)'](0, ...args);
    const fnPush = (self, ...args) =>
      self.methods['$push(uint256,uint256)'](0, ...args);
    const fnGetAtBlock = (self, ...args) =>
      self.methods['$getAtBlock(uint256,uint256)'](0, ...args);
    const fnGetAtRecentBlock = (self, ...args) =>
      self.methods['$getAtProbablyRecentBlock(uint256,uint256)'](0, ...args);
    const fnLength = (self, ...args) =>
      self.methods['$length_Checkpoints_History(uint256)'](0, ...args);

    describe('without checkpoints', function () {
      it('returns zero as latest value', async function () {
        expect(await fnLatest(this.mock)).to.be.bignumber.equal('0');

        const ckpt = await fnLatestCheckpoint(this.mock);
        expect(ckpt[0]).to.be.equal(false);
        expect(ckpt[1]).to.be.bignumber.equal('0');
        expect(ckpt[2]).to.be.bignumber.equal('0');
      });

      it('returns zero as past value', async function () {
        await time.advanceBlock();
        expect(await fnGetAtBlock(this.mock, await web3.eth.getBlockNumber() - 1)).to.be.bignumber.equal('0');
        expect(await fnGetAtRecentBlock(this.mock, await web3.eth.getBlockNumber() - 1)).to.be.bignumber.equal('0');
      });
    });

    describe('with checkpoints', function () {
      beforeEach('pushing checkpoints', async function () {
        this.tx1 = await fnPush(this.mock, 1);
        this.tx2 = await fnPush(this.mock, 2);
        await time.advanceBlock();
        this.tx3 = await fnPush(this.mock, 3);
        await time.advanceBlock();
        await time.advanceBlock();
      });

      it('returns latest value', async function () {
        expect(await fnLatest(this.mock)).to.be.bignumber.equal('3');

        const ckpt = await fnLatestCheckpoint(this.mock);
        expect(ckpt[0]).to.be.equal(true);
        expect(ckpt[1]).to.be.bignumber.equal(web3.utils.toBN(this.tx3.receipt.blockNumber));
        expect(ckpt[2]).to.be.bignumber.equal(web3.utils.toBN('3'));
      });

      for (const fn of [ fnGetAtBlock, fnGetAtRecentBlock ]) {
        describe(`lookup: ${fn}`, function () {
          it('returns past values', async function () {
            expect(await fn(this.mock, this.tx1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
            expect(await fn(this.mock, this.tx1.receipt.blockNumber)).to.be.bignumber.equal('1');
            expect(await fn(this.mock, this.tx2.receipt.blockNumber)).to.be.bignumber.equal('2');
            // Block with no new checkpoints
            expect(await fn(this.mock, this.tx2.receipt.blockNumber + 1)).to.be.bignumber.equal('2');
            expect(await fn(this.mock, this.tx3.receipt.blockNumber)).to.be.bignumber.equal('3');
            expect(await fn(this.mock, this.tx3.receipt.blockNumber + 1)).to.be.bignumber.equal('3');
          });
          it('reverts if block number >= current block', async function () {
            await expectRevert(
              fn(this.mock, await web3.eth.getBlockNumber()),
              'Checkpoints: block not yet mined',
            );

            await expectRevert(
              fn(this.mock, await web3.eth.getBlockNumber() + 1),
              'Checkpoints: block not yet mined',
            );
          });
        });
      }

      it('multiple checkpoints in the same block', async function () {
        const lengthBefore = await fnLength(this.mock);

        await batchInBlock([
          () => fnPush(this.mock, 8, { gas: 100000 }),
          () => fnPush(this.mock, 9, { gas: 100000 }),
          () => fnPush(this.mock, 10, { gas: 100000 }),
        ]);

        expect(await fnLength(this.mock)).to.be.bignumber.equal(lengthBefore.addn(1));
        expect(await fnLatest(this.mock)).to.be.bignumber.equal('10');
      });

      it('more than 5 checkpoints', async function () {
        for (let i = 4; i <= 6; i++) {
          await fnPush(this.mock, i);
        }
        expect(await fnLength(this.mock)).to.be.bignumber.equal('6');
        const block = await web3.eth.getBlockNumber();
        // recent
        expect(await fnGetAtRecentBlock(this.mock, block - 1)).to.be.bignumber.equal('5');
        // non-recent
        expect(await fnGetAtRecentBlock(this.mock, block - 9)).to.be.bignumber.equal('0');
      });
    });
  });

  for (const length of [160, 224]) {
    describe(`Trace${length}`, function () {
      const fnLatest = (self, ...args) =>
        self.methods[`$latest_Checkpoints_Trace${length}(uint256)`](0, ...args);
      const fnLatestCheckpoint = (self, ...args) =>
        self.methods[`$latestCheckpoint_Checkpoints_Trace${length}(uint256)`](0, ...args);
      const fnPush = (self, ...args) =>
        self.methods[`$push(uint256,uint${256 - length},uint${length})`](0, ...args);
      const fnUpperLookup = (self, ...args) =>
        self.methods[`$upperLookup(uint256,uint${256 - length})`](0, ...args);
      const fnLowerLookup = (self, ...args) =>
        self.methods[`$lowerLookup(uint256,uint${256 - length})`](0, ...args);
      const fnLength = (self, ...args) =>
        self.methods[`$length_Checkpoints_Trace${length}(uint256)`](0, ...args);

      describe('without checkpoints', function () {
        it('returns zero as latest value', async function () {
          expect(await fnLatest(this.mock)).to.be.bignumber.equal('0');

          const ckpt = await fnLatestCheckpoint(this.mock);
          expect(ckpt[0]).to.be.equal(false);
          expect(ckpt[1]).to.be.bignumber.equal('0');
          expect(ckpt[2]).to.be.bignumber.equal('0');
        });

        it('lookup returns 0', async function () {
          expect(await fnLowerLookup(this.mock, 0)).to.be.bignumber.equal('0');
          expect(await fnUpperLookup(this.mock, 0)).to.be.bignumber.equal('0');
        });
      });

      describe('with checkpoints', function () {
        beforeEach('pushing checkpoints', async function () {
          this.checkpoints = [
            { key: '2', value: '17' },
            { key: '3', value: '42' },
            { key: '5', value: '101' },
            { key: '7', value: '23' },
            { key: '11', value: '99' },
          ];
          for (const { key, value } of this.checkpoints) {
            await fnPush(this.mock, key, value);
          }
        });

        it('length', async function () {
          expect(await fnLength(this.mock))
            .to.be.bignumber.equal(this.checkpoints.length.toString());
        });

        it('returns latest value', async function () {
          expect(await fnLatest(this.mock)).to.be.bignumber.equal(last(this.checkpoints).value);

          const ckpt = await fnLatestCheckpoint(this.mock);
          expect(ckpt[0]).to.be.equal(true);
          expect(ckpt[1]).to.be.bignumber.equal(last(this.checkpoints).key);
          expect(ckpt[2]).to.be.bignumber.equal(last(this.checkpoints).value);
        });

        it('cannot push values in the past', async function () {
          await expectRevert(fnPush(this.mock, last(this.checkpoints).key - 1, '0'), 'Checkpoint: invalid key');
        });

        it('can update last value', async function () {
          const newValue = '42';

          // check length before the update
          expect(await fnLength(this.mock)).to.be.bignumber.equal(this.checkpoints.length.toString());

          // update last key
          await fnPush(this.mock, last(this.checkpoints).key, newValue);
          expect(await fnLatest(this.mock)).to.be.bignumber.equal(newValue);

          // check that length did not change
          expect(await fnLength(this.mock)).to.be.bignumber.equal(this.checkpoints.length.toString());
        });

        it('lower lookup', async function () {
          for (let i = 0; i < 14; ++i) {
            const value = first(this.checkpoints.filter(x => i <= x.key))?.value || '0';

            expect(await fnLowerLookup(this.mock, i)).to.be.bignumber.equal(value);
          }
        });

        it('upper lookup', async function () {
          for (let i = 0; i < 14; ++i) {
            const value = last(this.checkpoints.filter(x => i >= x.key))?.value || '0';

            expect(await fnUpperLookup(this.mock, i)).to.be.bignumber.equal(value);
          }
        });
      });
    });
  }
});
