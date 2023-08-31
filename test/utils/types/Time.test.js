require('@openzeppelin/test-helpers');

const { expect } = require('chai');
const { clock } = require('../../helpers/time');

const Time = artifacts.require('$Time');

const unpackDelay = delay => ({
  valueBefore: (BigInt(delay) >> 32n) % (1n << 32n),
  valueAfter: (BigInt(delay) >> 0n) % (1n << 32n),
  effect: (BigInt(delay) >> 64n) % (1n << 48n),
});

const packDelay = ({ valueBefore, valueAfter = 0n, effect = 0n }) =>
  (BigInt(valueAfter) % (1n << 32n) << 0n) +
  (BigInt(valueBefore) % (1n << 32n) << 32n) +
  (BigInt(effect) % (1n << 48n) << 64n);

const max = (first, ...values) => values.reduce((x, y) => (x > y ? x : y), first);

const MAX_UINT32 = 1n << (32n - 1n);
const MAX_UINT48 = 1n << (48n - 1n);

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

  it('isSetAndPast', async function () {
    for (const timepoint of [0n, 1n, 2n, 17n, 42n, MAX_UINT48])
      for (const ref of [0n, 1n, 2n, 17n, 42n, MAX_UINT48]) {
        expect(await this.mock.$isSetAndPast(timepoint, ref)).to.be.equal(timepoint != 0 && timepoint <= ref);
      }
  });

  describe('Delay', function () {
    describe('helpers', function () {
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
      for (const value of [0n, 1n, 2n, 17n, 42n, MAX_UINT32]) {
        const delay = await this.mock.$toDelay(value).then(unpackDelay);
        expect(delay).to.be.deep.equal({ valueBefore: 0n, valueAfter: value, effect: 0n });
      }
    });

    it('getAt & getFullAt', async function () {
      const valueBefore = 24194n;
      const valueAfter = 4214143n;

      for (const effect of [0n, 1n, 15n, 16n, 17n, 42n, MAX_UINT48])
        for (const timepoint of [0n, 1n, 15n, 16n, 17n, 42n, MAX_UINT48]) {
          const isPast = effect <= timepoint;

          const delay = packDelay({ valueBefore, valueAfter, effect });

          expect(await this.mock.$getAt(delay, timepoint)).to.be.bignumber.equal(
            String(isPast ? valueAfter : valueBefore),
          );

          const getFullAt = await this.mock.$getFullAt(delay, timepoint);
          expect(getFullAt[0]).to.be.bignumber.equal(String(isPast ? valueAfter : valueBefore));
          expect(getFullAt[1]).to.be.bignumber.equal(String(isPast ? 0n : valueAfter));
          expect(getFullAt[2]).to.be.bignumber.equal(String(isPast ? 0n : effect));
        }
    });

    it('get & getFull', async function () {
      const timepoint = await clock.timestamp().then(BigInt);
      const valueBefore = 24194n;
      const valueAfter = 4214143n;

      for (const effect of [0n, 1n, 15n, 16n, 17n, 42n, MAX_UINT48]) {
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

      for (const effect of [0n, 1n, 15n, 16n, 17n, 42n, MAX_UINT32])
        for (const minSetback of [0n, 1n, 15n, 16n, 17n, 42n, MAX_UINT32]) {
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