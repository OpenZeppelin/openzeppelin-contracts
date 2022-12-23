const { expectRevert, time } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const { batchInBlock } = require('../helpers/txpool');

const CheckpointsMock = artifacts.require('CheckpointsMock');

const first = (array) => array.length ? array[0] : undefined;
const last = (array) => array.length ? array[array.length - 1] : undefined;

contract('Checkpoints', function (accounts) {
  describe('History checkpoints', function () {
    beforeEach(async function () {
      this.checkpoint = await CheckpointsMock.new();
    });

    describe('without checkpoints', function () {
      it('returns zero as latest value', async function () {
        expect(await this.checkpoint.latest()).to.be.bignumber.equal('0');

        const ckpt = await this.checkpoint.latestCheckpoint();
        expect(ckpt[0]).to.be.equal(false);
        expect(ckpt[1]).to.be.bignumber.equal('0');
        expect(ckpt[2]).to.be.bignumber.equal('0');
      });

      it('returns zero as past value', async function () {
        await time.advanceBlock();
        expect(await this.checkpoint.getAtBlock(await web3.eth.getBlockNumber() - 1))
          .to.be.bignumber.equal('0');
        expect(await this.checkpoint.getAtProbablyRecentBlock(await web3.eth.getBlockNumber() - 1))
          .to.be.bignumber.equal('0');
      });
    });

    describe('with checkpoints', function () {
      beforeEach('pushing checkpoints', async function () {
        this.tx1 = await this.checkpoint.push(1);
        this.tx2 = await this.checkpoint.push(2);
        await time.advanceBlock();
        this.tx3 = await this.checkpoint.push(3);
        await time.advanceBlock();
        await time.advanceBlock();
      });

      it('returns latest value', async function () {
        expect(await this.checkpoint.latest()).to.be.bignumber.equal('3');

        const ckpt = await this.checkpoint.latestCheckpoint();
        expect(ckpt[0]).to.be.equal(true);
        expect(ckpt[1]).to.be.bignumber.equal(web3.utils.toBN(this.tx3.receipt.blockNumber));
        expect(ckpt[2]).to.be.bignumber.equal(web3.utils.toBN('3'));
      });

      for (const fn of [ 'getAtBlock(uint256)', 'getAtProbablyRecentBlock(uint256)' ]) {
        describe(`lookup: ${fn}`, function () {
          it('returns past values', async function () {
            expect(await this.checkpoint.methods[fn](this.tx1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
            expect(await this.checkpoint.methods[fn](this.tx1.receipt.blockNumber)).to.be.bignumber.equal('1');
            expect(await this.checkpoint.methods[fn](this.tx2.receipt.blockNumber)).to.be.bignumber.equal('2');
            // Block with no new checkpoints
            expect(await this.checkpoint.methods[fn](this.tx2.receipt.blockNumber + 1)).to.be.bignumber.equal('2');
            expect(await this.checkpoint.methods[fn](this.tx3.receipt.blockNumber)).to.be.bignumber.equal('3');
            expect(await this.checkpoint.methods[fn](this.tx3.receipt.blockNumber + 1)).to.be.bignumber.equal('3');
          });
          it('reverts if block number >= current block', async function () {
            await expectRevert(
              this.checkpoint.methods[fn](await web3.eth.getBlockNumber()),
              'Checkpoints: block not yet mined',
            );

            await expectRevert(
              this.checkpoint.methods[fn](await web3.eth.getBlockNumber() + 1),
              'Checkpoints: block not yet mined',
            );
          });
        });
      }

      it('multiple checkpoints in the same block', async function () {
        const lengthBefore = await this.checkpoint.length();

        await batchInBlock([
          () => this.checkpoint.push(8, { gas: 100000 }),
          () => this.checkpoint.push(9, { gas: 100000 }),
          () => this.checkpoint.push(10, { gas: 100000 }),
        ]);

        expect(await this.checkpoint.length()).to.be.bignumber.equal(lengthBefore.addn(1));
        expect(await this.checkpoint.latest()).to.be.bignumber.equal('10');
      });

      it('more than 5 checkpoints', async function () {
        for (let i = 4; i <= 6; i++) {
          await this.checkpoint.push(i);
        }
        expect(await this.checkpoint.length()).to.be.bignumber.equal('6');
        const block = await web3.eth.getBlockNumber();
        // recent
        expect(await this.checkpoint.getAtProbablyRecentBlock(block - 1)).to.be.bignumber.equal('5');
        // non-recent
        expect(await this.checkpoint.getAtProbablyRecentBlock(block - 9)).to.be.bignumber.equal('0');
      });
    });
  });

  for (const length of [160, 224]) {
    describe(`Trace${length}`, function () {
      beforeEach(async function () {
        this.contract = await artifacts.require(`Checkpoints${length}Mock`).new();
      });

      describe('without checkpoints', function () {
        it('returns zero as latest value', async function () {
          expect(await this.contract.latest()).to.be.bignumber.equal('0');

          const ckpt = await this.contract.latestCheckpoint();
          expect(ckpt[0]).to.be.equal(false);
          expect(ckpt[1]).to.be.bignumber.equal('0');
          expect(ckpt[2]).to.be.bignumber.equal('0');
        });

        it('lookup returns 0', async function () {
          expect(await this.contract.lowerLookup(0)).to.be.bignumber.equal('0');
          expect(await this.contract.upperLookup(0)).to.be.bignumber.equal('0');
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
            await this.contract.push(key, value);
          }
        });

        it('returns latest value', async function () {
          expect(await this.contract.latest()).to.be.bignumber.equal(last(this.checkpoints).value);

          const ckpt = await this.contract.latestCheckpoint();
          expect(ckpt[0]).to.be.equal(true);
          expect(ckpt[1]).to.be.bignumber.equal(last(this.checkpoints).key);
          expect(ckpt[2]).to.be.bignumber.equal(last(this.checkpoints).value);
        });

        it('cannot push values in the past', async function () {
          await expectRevert(this.contract.push(last(this.checkpoints).key - 1, '0'), 'Checkpoint: decreasing keys');
        });

        it('can update last value', async function () {
          const newValue = '42';

          // check length before the update
          expect(await this.contract.length()).to.be.bignumber.equal(this.checkpoints.length.toString());

          // update last key
          await this.contract.push(last(this.checkpoints).key, newValue);
          expect(await this.contract.latest()).to.be.bignumber.equal(newValue);

          // check that length did not change
          expect(await this.contract.length()).to.be.bignumber.equal(this.checkpoints.length.toString());
        });

        it('lower lookup', async function () {
          for (let i = 0; i < 14; ++i) {
            const value = first(this.checkpoints.filter(x => i <= x.key))?.value || '0';

            expect(await this.contract.lowerLookup(i)).to.be.bignumber.equal(value);
          }
        });

        it('upper lookup', async function () {
          for (let i = 0; i < 14; ++i) {
            const value = last(this.checkpoints.filter(x => i >= x.key))?.value || '0';

            expect(await this.contract.upperLookup(i)).to.be.bignumber.equal(value);
          }
        });
      });
    });
  }
});
