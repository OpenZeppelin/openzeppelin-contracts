const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { product } = require('../../helpers/iterate');
const { max } = require('../../helpers/math');
const {
  bigint: { clock },
} = require('../../helpers/time');

const MAX_UINT32 = 1n << (32n - 1n);
const MAX_UINT48 = 1n << (48n - 1n);
const SOME_VALUES = [0n, 1n, 2n, 15n, 16n, 17n, 42n];

const asUint = (value, size) => {
  value = ethers.toBigInt(value);
  size = ethers.toBigInt(size);
  expect(value).to.be.greaterThanOrEqual(0n, `value is not a valid uint${size}`);
  expect(value).to.be.lessThan(1n << size, `value is not a valid uint${size}`);
  return value;
};

const unpackDelay = delay => ({
  valueBefore: (asUint(delay, 112) >> 32n) % (1n << 32n),
  valueAfter: (asUint(delay, 112) >> 0n) % (1n << 32n),
  effect: (asUint(delay, 112) >> 64n) % (1n << 48n),
});

const packDelay = ({ valueBefore, valueAfter = 0n, effect = 0n }) =>
  (asUint(valueAfter, 32) << 0n) + (asUint(valueBefore, 32) << 32n) + (asUint(effect, 48) << 64n);

const effectSamplesForTimepoint = timepoint => [
  0n,
  timepoint,
  ...product([-1n, 1n], [1n, 2n, 17n, 42n])
    .map(([sign, shift]) => timepoint + sign * shift)
    .filter(effect => effect > 0n && effect <= MAX_UINT48),
  MAX_UINT48,
];

async function fixture() {
  const mock = await ethers.deployContract('$Time');
  return { mock };
}

contract('Time', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('clocks', function () {
    it('timestamp', async function () {
      expect(await this.mock.$timestamp()).to.equal(await clock.timestamp());
    });

    it('block number', async function () {
      expect(await this.mock.$blockNumber()).to.equal(await clock.blocknumber());
    });
  });

  describe('Delay', function () {
    describe('packing and unpacking', function () {
      const valueBefore = 17n;
      const valueAfter = 42n;
      const effect = 69n;
      const delay = 1272825341158973505578n;

      it('pack', async function () {
        expect(await this.mock.$pack(valueBefore, valueAfter, effect)).to.equal(delay);
        expect(packDelay({ valueBefore, valueAfter, effect })).to.equal(delay);
      });

      it('unpack', async function () {
        expect(await this.mock.$unpack(delay)).to.deep.equal([valueBefore, valueAfter, effect]);

        expect(unpackDelay(delay)).to.deep.equal({
          valueBefore,
          valueAfter,
          effect,
        });
      });
    });

    it('toDelay', async function () {
      for (const value of [...SOME_VALUES, MAX_UINT32]) {
        expect(await this.mock.$toDelay(value).then(unpackDelay)).to.deep.equal({
          valueBefore: 0n,
          valueAfter: value,
          effect: 0n,
        });
      }
    });

    it('get & getFull', async function () {
      const timepoint = await clock.timestamp().then(BigInt);
      const valueBefore = 24194n;
      const valueAfter = 4214143n;

      for (const effect of effectSamplesForTimepoint(timepoint)) {
        const isPast = effect <= timepoint;
        const delay = packDelay({ valueBefore, valueAfter, effect });

        expect(await this.mock.$get(delay)).to.equal(isPast ? valueAfter : valueBefore);
        expect(await this.mock.$getFull(delay)).to.deep.equal([
          isPast ? valueAfter : valueBefore,
          isPast ? 0n : valueAfter,
          isPast ? 0n : effect,
        ]);
      }
    });

    it('withUpdate', async function () {
      const timepoint = await clock.timestamp().then(BigInt);
      const valueBefore = 24194n;
      const valueAfter = 4214143n;
      const newvalueAfter = 94716n;

      for (const effect of effectSamplesForTimepoint(timepoint))
        for (const minSetback of [...SOME_VALUES, MAX_UINT32]) {
          const isPast = effect <= timepoint;
          const expectedvalueBefore = isPast ? valueAfter : valueBefore;
          const expectedSetback = max(minSetback, expectedvalueBefore - newvalueAfter, 0n);

          expect(
            await this.mock.$withUpdate(packDelay({ valueBefore, valueAfter, effect }), newvalueAfter, minSetback),
          ).to.deep.equal([
            packDelay({
              valueBefore: expectedvalueBefore,
              valueAfter: newvalueAfter,
              effect: timepoint + expectedSetback,
            }),
            timepoint + expectedSetback,
          ]);
        }
    });
  });
});
