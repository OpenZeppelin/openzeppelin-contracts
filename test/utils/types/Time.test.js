require('@openzeppelin/test-helpers');

const { expect } = require('chai');
const { clock } = require('../../helpers/time');
const { product, max } = require('../../helpers/iterate');

const Time = artifacts.require('$Time');

const MAX_UINT32 = 1n << (32n - 1n);
const MAX_UINT48 = 1n << (48n - 1n);
const SOME_VALUES = [0n, 1n, 2n, 15n, 16n, 17n, 42n];

const asUint = (value, size) => {
  if (typeof value != 'bigint') {
    value = BigInt(value);
  }
  // chai does not support bigint :/
  if (value < 0 || value >= 1n << BigInt(size)) {
    throw new Error(`value is not a valid uint${size}`);
  }
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

contract('Time', function () {
  beforeEach(async function () {
    this.mock = await Time.new();
  });

  describe('clocks', function () {
    it('timestamp', async function () {
      expect(await this.mock.$timestamp()).to.be.bignumber.equal(web3.utils.toBN(await clock.timestamp()));
    });

    it('block number', async function () {
      expect(await this.mock.$blockNumber()).to.be.bignumber.equal(web3.utils.toBN(await clock.blocknumber()));
    });
  });

  describe('Delay', function () {
    describe('packing and unpacking', function () {
      const valueBefore = 17n;
      const valueAfter = 42n;
      const effect = 69n;
      const delay = 1272825341158973505578n;

      it('pack', async function () {
        const packed = await this.mock.$pack(valueBefore, valueAfter, effect);
        expect(packed).to.be.bignumber.equal(delay.toString());

        const packed2 = packDelay({ valueBefore, valueAfter, effect });
        expect(packed2).to.be.equal(delay);
      });

      it('unpack', async function () {
        const unpacked = await this.mock.$unpack(delay);
        expect(unpacked[0]).to.be.bignumber.equal(valueBefore.toString());
        expect(unpacked[1]).to.be.bignumber.equal(valueAfter.toString());
        expect(unpacked[2]).to.be.bignumber.equal(effect.toString());

        const unpacked2 = unpackDelay(delay);
        expect(unpacked2).to.be.deep.equal({ valueBefore, valueAfter, effect });
      });
    });

    it('toDelay', async function () {
      for (const value of [...SOME_VALUES, MAX_UINT32]) {
        const delay = await this.mock.$toDelay(value).then(unpackDelay);
        expect(delay).to.be.deep.equal({ valueBefore: 0n, valueAfter: value, effect: 0n });
      }
    });

    it('get & getFull', async function () {
      const timepoint = await clock.timestamp().then(BigInt);
      const valueBefore = 24194n;
      const valueAfter = 4214143n;

      for (const effect of effectSamplesForTimepoint(timepoint)) {
        const isPast = effect <= timepoint;

        const delay = packDelay({ valueBefore, valueAfter, effect });

        expect(await this.mock.$get(delay)).to.be.bignumber.equal(String(isPast ? valueAfter : valueBefore));

        const result = await this.mock.$getFull(delay);
        expect(result[0]).to.be.bignumber.equal(String(isPast ? valueAfter : valueBefore));
        expect(result[1]).to.be.bignumber.equal(String(isPast ? 0n : valueAfter));
        expect(result[2]).to.be.bignumber.equal(String(isPast ? 0n : effect));
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

          const result = await this.mock.$withUpdate(
            packDelay({ valueBefore, valueAfter, effect }),
            newvalueAfter,
            minSetback,
          );

          expect(result[0]).to.be.bignumber.equal(
            String(
              packDelay({
                valueBefore: expectedvalueBefore,
                valueAfter: newvalueAfter,
                effect: timepoint + expectedSetback,
              }),
            ),
          );
          expect(result[1]).to.be.bignumber.equal(String(timepoint + expectedSetback));
        }
    });
  });
});
