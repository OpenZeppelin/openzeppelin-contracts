const { expectRevert, time } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const { batchInBlock } = require('../helpers/txpool');

const $Checkpoints = artifacts.require('$Checkpoints');

// The library name may be 'Checkpoints' or 'CheckpointsUpgradeable'
const libraryName = $Checkpoints._json.contractName.replace(/^\$/, '');

const traceLengths = [160, 224];

const first = array => (array.length ? array[0] : undefined);
const last = array => (array.length ? array[array.length - 1] : undefined);

contract('Checkpoints', function () {
  beforeEach(async function () {
    this.mock = await $Checkpoints.new();

    this.methods = { trace: {} };
    this.methods.history = {
      latest: (...args) => this.mock.methods[`$latest_${libraryName}_History(uint256)`](0, ...args),
      latestCheckpoint: (...args) => this.mock.methods[`$latestCheckpoint_${libraryName}_History(uint256)`](0, ...args),
      length: (...args) => this.mock.methods[`$length_${libraryName}_History(uint256)`](0, ...args),
      push: (...args) => this.mock.methods['$push(uint256,uint256)'](0, ...args),
      getAtBlock: (...args) => this.mock.$getAtBlock(0, ...args),
      getAtRecentBlock: (...args) => this.mock.$getAtProbablyRecentBlock(0, ...args),
    };
    for (const length of traceLengths) {
      this.methods.trace[length] = {
        latest: (...args) => this.mock.methods[`$latest_${libraryName}_Trace${length}(uint256)`](0, ...args),
        latestCheckpoint: (...args) =>
          this.mock.methods[`$latestCheckpoint_${libraryName}_Trace${length}(uint256)`](0, ...args),
        length: (...args) => this.mock.methods[`$length_${libraryName}_Trace${length}(uint256)`](0, ...args),
        push: (...args) => this.mock.methods[`$push(uint256,uint${256 - length},uint${length})`](0, ...args),
        lowerLookup: (...args) => this.mock.methods[`$lowerLookup(uint256,uint${256 - length})`](0, ...args),
        upperLookup: (...args) => this.mock.methods[`$upperLookup(uint256,uint${256 - length})`](0, ...args),
        upperLookupRecent: (...args) =>
          this.mock.methods[`$upperLookupRecent(uint256,uint${256 - length})`](0, ...args),
      };
    }
  });

  describe('History checkpoints', function () {
    describe('without checkpoints', function () {
      it('returns zero as latest value', async function () {
        expect(await this.methods.history.latest()).to.be.bignumber.equal('0');

        const ckpt = await this.methods.history.latestCheckpoint();
        expect(ckpt[0]).to.be.equal(false);
        expect(ckpt[1]).to.be.bignumber.equal('0');
        expect(ckpt[2]).to.be.bignumber.equal('0');
      });

      it('returns zero as past value', async function () {
        await time.advanceBlock();
        expect(await this.methods.history.getAtBlock((await web3.eth.getBlockNumber()) - 1)).to.be.bignumber.equal('0');
        expect(
          await this.methods.history.getAtRecentBlock((await web3.eth.getBlockNumber()) - 1),
        ).to.be.bignumber.equal('0');
      });
    });

    describe('with checkpoints', function () {
      beforeEach('pushing checkpoints', async function () {
        this.tx1 = await this.methods.history.push(1);
        this.tx2 = await this.methods.history.push(2);
        await time.advanceBlock();
        this.tx3 = await this.methods.history.push(3);
        await time.advanceBlock();
        await time.advanceBlock();
      });

      it('returns latest value', async function () {
        expect(await this.methods.history.latest()).to.be.bignumber.equal('3');

        const ckpt = await this.methods.history.latestCheckpoint();
        expect(ckpt[0]).to.be.equal(true);
        expect(ckpt[1]).to.be.bignumber.equal(web3.utils.toBN(this.tx3.receipt.blockNumber));
        expect(ckpt[2]).to.be.bignumber.equal(web3.utils.toBN('3'));
      });

      for (const getAtBlockVariant of ['getAtBlock', 'getAtRecentBlock']) {
        describe(`lookup: ${getAtBlockVariant}`, function () {
          it('returns past values', async function () {
            expect(
              await this.methods.history[getAtBlockVariant](this.tx1.receipt.blockNumber - 1),
            ).to.be.bignumber.equal('0');
            expect(await this.methods.history[getAtBlockVariant](this.tx1.receipt.blockNumber)).to.be.bignumber.equal(
              '1',
            );
            expect(await this.methods.history[getAtBlockVariant](this.tx2.receipt.blockNumber)).to.be.bignumber.equal(
              '2',
            );
            // Block with no new checkpoints
            expect(
              await this.methods.history[getAtBlockVariant](this.tx2.receipt.blockNumber + 1),
            ).to.be.bignumber.equal('2');
            expect(await this.methods.history[getAtBlockVariant](this.tx3.receipt.blockNumber)).to.be.bignumber.equal(
              '3',
            );
            expect(
              await this.methods.history[getAtBlockVariant](this.tx3.receipt.blockNumber + 1),
            ).to.be.bignumber.equal('3');
          });
          it('reverts if block number >= current block', async function () {
            await expectRevert(
              this.methods.history[getAtBlockVariant](await web3.eth.getBlockNumber()),
              'Checkpoints: block not yet mined',
            );

            await expectRevert(
              this.methods.history[getAtBlockVariant]((await web3.eth.getBlockNumber()) + 1),
              'Checkpoints: block not yet mined',
            );
          });
        });
      }

      it('multiple checkpoints in the same block', async function () {
        const lengthBefore = await this.methods.history.length();

        await batchInBlock([
          () => this.methods.history.push(8, { gas: 100000 }),
          () => this.methods.history.push(9, { gas: 100000 }),
          () => this.methods.history.push(10, { gas: 100000 }),
        ]);

        expect(await this.methods.history.length()).to.be.bignumber.equal(lengthBefore.addn(1));
        expect(await this.methods.history.latest()).to.be.bignumber.equal('10');
      });

      it('more than 5 checkpoints', async function () {
        for (let i = 4; i <= 6; i++) {
          await this.methods.history.push(i);
        }
        expect(await this.methods.history.length()).to.be.bignumber.equal('6');
        const block = await web3.eth.getBlockNumber();
        // recent
        expect(await this.methods.history.getAtRecentBlock(block - 1)).to.be.bignumber.equal('5');
        // non-recent
        expect(await this.methods.history.getAtRecentBlock(block - 9)).to.be.bignumber.equal('0');
      });
    });
  });

  for (const length of traceLengths) {
    describe(`Trace${length}`, function () {
      describe('without checkpoints', function () {
        it('returns zero as latest value', async function () {
          expect(await this.methods.trace[length].latest()).to.be.bignumber.equal('0');

          const ckpt = await this.methods.trace[length].latestCheckpoint();
          expect(ckpt[0]).to.be.equal(false);
          expect(ckpt[1]).to.be.bignumber.equal('0');
          expect(ckpt[2]).to.be.bignumber.equal('0');
        });

        it('lookup returns 0', async function () {
          expect(await this.methods.trace[length].lowerLookup(0)).to.be.bignumber.equal('0');
          expect(await this.methods.trace[length].upperLookup(0)).to.be.bignumber.equal('0');
          expect(await this.methods.trace[length].upperLookupRecent(0)).to.be.bignumber.equal('0');
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
            await this.methods.trace[length].push(key, value);
          }
        });

        it('length', async function () {
          expect(await this.methods.trace[length].length()).to.be.bignumber.equal(this.checkpoints.length.toString());
        });

        it('returns latest value', async function () {
          expect(await this.methods.trace[length].latest()).to.be.bignumber.equal(last(this.checkpoints).value);

          const ckpt = await this.methods.trace[length].latestCheckpoint();
          expect(ckpt[0]).to.be.equal(true);
          expect(ckpt[1]).to.be.bignumber.equal(last(this.checkpoints).key);
          expect(ckpt[2]).to.be.bignumber.equal(last(this.checkpoints).value);
        });

        it('cannot push values in the past', async function () {
          await expectRevert(
            this.methods.trace[length].push(last(this.checkpoints).key - 1, '0'),
            'Checkpoint: decreasing keys',
          );
        });

        it('can update last value', async function () {
          const newValue = '42';

          // check length before the update
          expect(await this.methods.trace[length].length()).to.be.bignumber.equal(this.checkpoints.length.toString());

          // update last key
          await this.methods.trace[length].push(last(this.checkpoints).key, newValue);
          expect(await this.methods.trace[length].latest()).to.be.bignumber.equal(newValue);

          // check that length did not change
          expect(await this.methods.trace[length].length()).to.be.bignumber.equal(this.checkpoints.length.toString());
        });

        it('lower lookup', async function () {
          for (let i = 0; i < 14; ++i) {
            const value = first(this.checkpoints.filter(x => i <= x.key))?.value || '0';

            expect(await this.methods.trace[length].lowerLookup(i)).to.be.bignumber.equal(value);
          }
        });

        it('upper lookup & upperLookupRecent', async function () {
          for (let i = 0; i < 14; ++i) {
            const value = last(this.checkpoints.filter(x => i >= x.key))?.value || '0';

            expect(await this.methods.trace[length].upperLookup(i)).to.be.bignumber.equal(value);
            expect(await this.methods.trace[length].upperLookupRecent(i)).to.be.bignumber.equal(value);
          }
        });

        it('upperLookupRecent with more than 5 checkpoints', async function () {
          const moreCheckpoints = [
            { key: '12', value: '22' },
            { key: '13', value: '131' },
            { key: '17', value: '45' },
            { key: '19', value: '31452' },
            { key: '21', value: '0' },
          ];
          const allCheckpoints = [].concat(this.checkpoints, moreCheckpoints);

          for (const { key, value } of moreCheckpoints) {
            await this.methods.trace[length].push(key, value);
          }

          for (let i = 0; i < 25; ++i) {
            const value = last(allCheckpoints.filter(x => i >= x.key))?.value || '0';
            expect(await this.methods.trace[length].upperLookup(i)).to.be.bignumber.equal(value);
            expect(await this.methods.trace[length].upperLookupRecent(i)).to.be.bignumber.equal(value);
          }
        });
      });
    });
  }
});
