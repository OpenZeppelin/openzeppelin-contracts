require('@openzeppelin/test-helpers');

const { expect } = require('chai');
const { clock } = require('../../helpers/time');

const Time = artifacts.require('$Time');

const unpackDelay = delay => ({
  oldValue: (BigInt(delay) >> 0n) % (1n << 32n),
  newValue: (BigInt(delay) >> 32n) % (1n << 32n),
  effect: (BigInt(delay) >> 64n) % (1n << 48n),
});

const packDelay = ({ oldValue, newValue = 0n, effect = 0n }) =>
  (BigInt(oldValue) % (1n << 32n) << 0n) +
  (BigInt(newValue) % (1n << 32n) << 32n) +
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
      const oldValue = 17n;
      const newValue = 42n;
      const effect = 69n;
      const delay = 1272825341266347687953n;

      it('pack', async function () {
        const packed = await this.mock.$pack(oldValue, newValue, effect);
        expect(packed).to.be.bignumber.equal(delay.toString());

        const packed2 = packDelay({ oldValue, newValue, effect });
        expect(packed2).to.be.equal(delay);
      });

      it('unpack', async function () {
        const unpacked = await this.mock.$unpack(delay);
        expect(unpacked[0]).to.be.bignumber.equal(oldValue.toString());
        expect(unpacked[1]).to.be.bignumber.equal(newValue.toString());
        expect(unpacked[2]).to.be.bignumber.equal(effect.toString());

        const unpacked2 = unpackDelay(delay);
        expect(unpacked2).to.be.deep.equal({ oldValue, newValue, effect });
      });
    });

    it('toDelay', async function () {
      for (const value of [0n, 1n, 2n, 17n, 42n, MAX_UINT32]) {
        const delay = await this.mock.$toDelay(value).then(unpackDelay);
        expect(delay).to.be.deep.equal({ oldValue: value, newValue: 0n, effect: 0n });
      }
    });

    it('getAt & getFullAt', async function () {
      const oldValue = 24194n;
      const newValue = 4214143n;

      for (const effect of [0n, 1n, 15n, 16n, 17n, 42n, MAX_UINT48])
        for (const timepoint of [0n, 1n, 15n, 16n, 17n, 42n, MAX_UINT48]) {
          const setAndPast = effect != 0 && effect <= timepoint;

          const delay = packDelay({ oldValue, newValue, effect });

          expect(await this.mock.$getAt(delay, timepoint)).to.be.bignumber.equal(
            String(setAndPast ? newValue : oldValue),
          );

          const getFullAt = await this.mock.$getFullAt(delay, timepoint);
          expect(getFullAt[0]).to.be.bignumber.equal(String(setAndPast ? newValue : oldValue));
          expect(getFullAt[1]).to.be.bignumber.equal(String(setAndPast ? 0n : newValue));
          expect(getFullAt[2]).to.be.bignumber.equal(String(setAndPast ? 0n : effect));
        }
    });

    it('get & getFull', async function () {
      const timepoint = await clock.timestamp().then(BigInt);
      const oldValue = 24194n;
      const newValue = 4214143n;

      for (const effect of [0n, 1n, 15n, 16n, 17n, 42n, MAX_UINT48]) {
        const setAndPast = effect != 0 && effect <= timepoint;

        const delay = packDelay({ oldValue, newValue, effect });

        expect(await this.mock.$get(delay)).to.be.bignumber.equal(String(setAndPast ? newValue : oldValue));

        const result = await this.mock.$getFull(delay);
        expect(result[0]).to.be.bignumber.equal(String(setAndPast ? newValue : oldValue));
        expect(result[1]).to.be.bignumber.equal(String(setAndPast ? 0n : newValue));
        expect(result[2]).to.be.bignumber.equal(String(setAndPast ? 0n : effect));
      }
    });

    it('withUpdateAt', async function () {
      const timepoint = await clock.timestamp().then(BigInt);
      const oldValue = 24194n;
      const newValue = 4214143n;
      const newNewValue = 94716n;

      for (const effect of [0n, 1n, 15n, 16n, 17n, 42n, MAX_UINT48])
        for (const when of [0n, 1n, 15n, 16n, 17n, 42n, MAX_UINT48]) {
          const setAndPast = effect != 0 && effect <= timepoint;

          const delay = await this.mock.$withUpdateAt(packDelay({ oldValue, newValue, effect }), newNewValue, when);

          expect(delay).to.be.bignumber.equal(
            String(
              packDelay({
                oldValue: setAndPast ? newValue : oldValue,
                newValue: newNewValue,
                effect: when,
              }),
            ),
          );
        }
    });

    it('withUpdate', async function () {
      const timepoint = await clock.timestamp().then(BigInt);
      const oldValue = 24194n;
      const newValue = 4214143n;
      const newNewValue = 94716n;

      for (const effect of [0n, 1n, 15n, 16n, 17n, 42n, MAX_UINT32])
        for (const minSetback of [0n, 1n, 15n, 16n, 17n, 42n, MAX_UINT32]) {
          const setAndPast = effect != 0 && effect <= timepoint;
          const expectedOldValue = setAndPast ? newValue : oldValue;
          const expectedSetback = max(minSetback, expectedOldValue - newNewValue, 0n);

          const result = await this.mock.$withUpdate(
            packDelay({ oldValue, newValue, effect }),
            newNewValue,
            minSetback,
          );

          expect(result[0]).to.be.bignumber.equal(
            String(
              packDelay({
                oldValue: expectedOldValue,
                newValue: newNewValue,
                effect: timepoint + expectedSetback,
              }),
            ),
          );
          expect(result[1]).to.be.bignumber.equal(String(timepoint + expectedSetback));
        }
    });
  });
});
