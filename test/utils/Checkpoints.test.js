const { expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const $Checkpoints = artifacts.require('$Checkpoints');

const first = array => (array.length ? array[0] : undefined);
const last = array => (array.length ? array[array.length - 1] : undefined);

contract('Checkpoints', function () {
  beforeEach(async function () {
    this.mock = await $Checkpoints.new();
  });

  for (const length of [160, 224]) {
    describe(`Trace${length}`, function () {
      const latest = (self, ...args) => self.methods[`$latest_Checkpoints_Trace${length}(uint256)`](0, ...args);
      const latestCheckpoint = (self, ...args) =>
        self.methods[`$latestCheckpoint_Checkpoints_Trace${length}(uint256)`](0, ...args);
      const push = (self, ...args) => self.methods[`$push(uint256,uint${256 - length},uint${length})`](0, ...args);
      const upperLookup = (self, ...args) => self.methods[`$upperLookup(uint256,uint${256 - length})`](0, ...args);
      const lowerLookup = (self, ...args) => self.methods[`$lowerLookup(uint256,uint${256 - length})`](0, ...args);
      const getLength = (self, ...args) => self.methods[`$length_Checkpoints_Trace${length}(uint256)`](0, ...args);

      describe('without checkpoints', function () {
        it('returns zero as latest value', async function () {
          expect(await latest(this.mock)).to.be.bignumber.equal('0');

          const ckpt = await latestCheckpoint(this.mock);
          expect(ckpt[0]).to.be.equal(false);
          expect(ckpt[1]).to.be.bignumber.equal('0');
          expect(ckpt[2]).to.be.bignumber.equal('0');
        });

        it('lookup returns 0', async function () {
          expect(await lowerLookup(this.mock, 0)).to.be.bignumber.equal('0');
          expect(await upperLookup(this.mock, 0)).to.be.bignumber.equal('0');
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
            await push(this.mock, key, value);
          }
        });

        it('length', async function () {
          expect(await getLength(this.mock)).to.be.bignumber.equal(this.checkpoints.length.toString());
        });

        it('returns latest value', async function () {
          expect(await latest(this.mock)).to.be.bignumber.equal(last(this.checkpoints).value);

          const ckpt = await latestCheckpoint(this.mock);
          expect(ckpt[0]).to.be.equal(true);
          expect(ckpt[1]).to.be.bignumber.equal(last(this.checkpoints).key);
          expect(ckpt[2]).to.be.bignumber.equal(last(this.checkpoints).value);
        });

        it('cannot push values in the past', async function () {
          await expectRevert(push(this.mock, last(this.checkpoints).key - 1, '0'), 'Checkpoint: decreasing keys');
        });

        it('can update last value', async function () {
          const newValue = '42';

          // check length before the update
          expect(await getLength(this.mock)).to.be.bignumber.equal(this.checkpoints.length.toString());

          // update last key
          await push(this.mock, last(this.checkpoints).key, newValue);
          expect(await latest(this.mock)).to.be.bignumber.equal(newValue);

          // check that length did not change
          expect(await getLength(this.mock)).to.be.bignumber.equal(this.checkpoints.length.toString());
        });

        it('lower lookup', async function () {
          for (let i = 0; i < 14; ++i) {
            const value = first(this.checkpoints.filter(x => i <= x.key))?.value || '0';

            expect(await lowerLookup(this.mock, i)).to.be.bignumber.equal(value);
          }
        });

        it('upper lookup', async function () {
          for (let i = 0; i < 14; ++i) {
            const value = last(this.checkpoints.filter(x => i >= x.key))?.value || '0';

            expect(await upperLookup(this.mock, i)).to.be.bignumber.equal(value);
          }
        });
      });
    });
  }
});
