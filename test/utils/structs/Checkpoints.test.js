require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const { VALUE_SIZES } = require('../../../scripts/generate/templates/Checkpoints.opts.js');
const { expectRevertCustomError } = require('../../helpers/customError.js');
const { expectRevert } = require('@openzeppelin/test-helpers');

const $Checkpoints = artifacts.require('$Checkpoints');

// The library name may be 'Checkpoints' or 'CheckpointsUpgradeable'
const libraryName = $Checkpoints._json.contractName.replace(/^\$/, '');

const first = array => (array.length ? array[0] : undefined);
const last = array => (array.length ? array[array.length - 1] : undefined);

contract('Checkpoints', function () {
  beforeEach(async function () {
    this.mock = await $Checkpoints.new();
  });

  for (const length of VALUE_SIZES) {
    describe(`Trace${length}`, function () {
      beforeEach(async function () {
        this.methods = {
          at: (...args) => this.mock.methods[`$at_${libraryName}_Trace${length}(uint256,uint32)`](0, ...args),
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
      });

      describe('without checkpoints', function () {
        it('at zero reverts', async function () {
          // Reverts with array out of bound access, which is unspecified
          await expectRevert.unspecified(this.methods.at(0));
        });

        it('returns zero as latest value', async function () {
          expect(await this.methods.latest()).to.be.bignumber.equal('0');

          const ckpt = await this.methods.latestCheckpoint();
          expect(ckpt[0]).to.be.equal(false);
          expect(ckpt[1]).to.be.bignumber.equal('0');
          expect(ckpt[2]).to.be.bignumber.equal('0');
        });

        it('lookup returns 0', async function () {
          expect(await this.methods.lowerLookup(0)).to.be.bignumber.equal('0');
          expect(await this.methods.upperLookup(0)).to.be.bignumber.equal('0');
          expect(await this.methods.upperLookupRecent(0)).to.be.bignumber.equal('0');
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
            await this.methods.push(key, value);
          }
        });

        it('at keys', async function () {
          for (const [index, { key, value }] of this.checkpoints.entries()) {
            const at = await this.methods.at(index);
            expect(at._value).to.be.bignumber.equal(value);
            expect(at._key).to.be.bignumber.equal(key);
          }
        });

        it('length', async function () {
          expect(await this.methods.length()).to.be.bignumber.equal(this.checkpoints.length.toString());
        });

        it('returns latest value', async function () {
          expect(await this.methods.latest()).to.be.bignumber.equal(last(this.checkpoints).value);

          const ckpt = await this.methods.latestCheckpoint();
          expect(ckpt[0]).to.be.equal(true);
          expect(ckpt[1]).to.be.bignumber.equal(last(this.checkpoints).key);
          expect(ckpt[2]).to.be.bignumber.equal(last(this.checkpoints).value);
        });

        it('cannot push values in the past', async function () {
          await expectRevertCustomError(
            this.methods.push(last(this.checkpoints).key - 1, '0'),
            'CheckpointUnorderedInsertion',
            [],
          );
        });

        it('can update last value', async function () {
          const newValue = '42';

          // check length before the update
          expect(await this.methods.length()).to.be.bignumber.equal(this.checkpoints.length.toString());

          // update last key
          await this.methods.push(last(this.checkpoints).key, newValue);
          expect(await this.methods.latest()).to.be.bignumber.equal(newValue);

          // check that length did not change
          expect(await this.methods.length()).to.be.bignumber.equal(this.checkpoints.length.toString());
        });

        it('lower lookup', async function () {
          for (let i = 0; i < 14; ++i) {
            const value = first(this.checkpoints.filter(x => i <= x.key))?.value || '0';

            expect(await this.methods.lowerLookup(i)).to.be.bignumber.equal(value);
          }
        });

        it('upper lookup & upperLookupRecent', async function () {
          for (let i = 0; i < 14; ++i) {
            const value = last(this.checkpoints.filter(x => i >= x.key))?.value || '0';

            expect(await this.methods.upperLookup(i)).to.be.bignumber.equal(value);
            expect(await this.methods.upperLookupRecent(i)).to.be.bignumber.equal(value);
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
            await this.methods.push(key, value);
          }

          for (let i = 0; i < 25; ++i) {
            const value = last(allCheckpoints.filter(x => i >= x.key))?.value || '0';
            expect(await this.methods.upperLookup(i)).to.be.bignumber.equal(value);
            expect(await this.methods.upperLookupRecent(i)).to.be.bignumber.equal(value);
          }
        });
      });
    });
  }
});
