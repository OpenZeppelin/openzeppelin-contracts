const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { OPTS } = require('../../../scripts/generate/templates/Checkpoints.opts');

describe('Checkpoints', function () {
  for (const opt of OPTS) {
    describe(opt.historyTypeName, function () {
      const fixture = async () => {
        const mock = await ethers.deployContract('$Checkpoints');
        const methods = {
          at: (...args) => mock.getFunction(`$at_Checkpoints_${opt.historyTypeName}`)(0, ...args),
          latest: (...args) => mock.getFunction(`$latest_Checkpoints_${opt.historyTypeName}`)(0, ...args),
          latestCheckpoint: (...args) =>
            mock.getFunction(`$latestCheckpoint_Checkpoints_${opt.historyTypeName}`)(0, ...args),
          length: (...args) => mock.getFunction(`$length_Checkpoints_${opt.historyTypeName}`)(0, ...args),
          push: (...args) => mock.getFunction(`$push(uint256,${opt.keyTypeName},${opt.valueTypeName})`)(0, ...args),
          lowerLookup: (...args) => mock.getFunction(`$lowerLookup(uint256,${opt.keyTypeName})`)(0, ...args),
          upperLookup: (...args) => mock.getFunction(`$upperLookup(uint256,${opt.keyTypeName})`)(0, ...args),
          upperLookupRecent: (...args) =>
            mock.getFunction(`$upperLookupRecent(uint256,${opt.keyTypeName})`)(0, ...args),
        };

        return { mock, methods };
      };

      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
      });

      describe('without checkpoints', function () {
        it('at zero reverts', async function () {
          // Reverts with array out of bound access, which is unspecified
          await expect(this.methods.at(0)).to.be.reverted;
        });

        it('returns zero as latest value', async function () {
          expect(await this.methods.latest()).to.equal(0n);

          const ckpt = await this.methods.latestCheckpoint();
          expect(ckpt[0]).to.be.false;
          expect(ckpt[1]).to.equal(0n);
          expect(ckpt[2]).to.equal(0n);
        });

        it('lookup returns 0', async function () {
          expect(await this.methods.lowerLookup(0)).to.equal(0n);
          expect(await this.methods.upperLookup(0)).to.equal(0n);
          expect(await this.methods.upperLookupRecent(0)).to.equal(0n);
        });
      });

      describe('with checkpoints', function () {
        beforeEach('pushing checkpoints', async function () {
          this.checkpoints = [
            { key: 2n, value: 17n },
            { key: 3n, value: 42n },
            { key: 5n, value: 101n },
            { key: 7n, value: 23n },
            { key: 11n, value: 99n },
          ];
          for (const { key, value } of this.checkpoints) {
            await this.methods.push(key, value);
          }
        });

        it('at keys', async function () {
          for (const [index, { key, value }] of this.checkpoints.entries()) {
            const at = await this.methods.at(index);
            expect(at._value).to.equal(value);
            expect(at._key).to.equal(key);
          }
        });

        it('length', async function () {
          expect(await this.methods.length()).to.equal(this.checkpoints.length);
        });

        it('returns latest value', async function () {
          const latest = this.checkpoints.at(-1);
          expect(await this.methods.latest()).to.equal(latest.value);
          expect(await this.methods.latestCheckpoint()).to.deep.equal([true, latest.key, latest.value]);
        });

        it('cannot push values in the past', async function () {
          await expect(this.methods.push(this.checkpoints.at(-1).key - 1n, 0n)).to.be.revertedWithCustomError(
            this.mock,
            'CheckpointUnorderedInsertion',
          );
        });

        it('can update last value', async function () {
          const newValue = 42n;

          // check length before the update
          expect(await this.methods.length()).to.equal(this.checkpoints.length);

          // update last key
          await this.methods.push(this.checkpoints.at(-1).key, newValue);
          expect(await this.methods.latest()).to.equal(newValue);

          // check that length did not change
          expect(await this.methods.length()).to.equal(this.checkpoints.length);
        });

        it('lower lookup', async function () {
          for (let i = 0; i < 14; ++i) {
            const value = this.checkpoints.find(x => i <= x.key)?.value || 0n;

            expect(await this.methods.lowerLookup(i)).to.equal(value);
          }
        });

        it('upper lookup & upperLookupRecent', async function () {
          for (let i = 0; i < 14; ++i) {
            const value = this.checkpoints.findLast(x => i >= x.key)?.value || 0n;

            expect(await this.methods.upperLookup(i)).to.equal(value);
            expect(await this.methods.upperLookupRecent(i)).to.equal(value);
          }
        });

        it('upperLookupRecent with more than 5 checkpoints', async function () {
          const moreCheckpoints = [
            { key: 12n, value: 22n },
            { key: 13n, value: 131n },
            { key: 17n, value: 45n },
            { key: 19n, value: 31452n },
            { key: 21n, value: 0n },
          ];
          const allCheckpoints = [].concat(this.checkpoints, moreCheckpoints);

          for (const { key, value } of moreCheckpoints) {
            await this.methods.push(key, value);
          }

          for (let i = 0; i < 25; ++i) {
            const value = allCheckpoints.findLast(x => i >= x.key)?.value || 0n;
            expect(await this.methods.upperLookup(i)).to.equal(value);
            expect(await this.methods.upperLookupRecent(i)).to.equal(value);
          }
        });
      });
    });
  }
});
