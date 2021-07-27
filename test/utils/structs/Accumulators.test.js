const { expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Accumulators = artifacts.require('AccumulatorsMock');

contract('Accumulators', function (accounts) {
  beforeEach(async function () {
    this.accumulators = await Accumulators.new();
  });

  it('starts empty', async function () {
    const timestampAccumulator = await this.accumulators.timestampAccumulator();
    expect(timestampAccumulator.timestamp).to.be.bignumber.equal('0');
    expect(timestampAccumulator.sum).to.be.bignumber.equal('0');
  });

  describe('initialize', function () {
    it('works', async function () {
      await this.accumulators.initialize(1, 2);
      const timestampAccumulator = await this.accumulators.timestampAccumulator();
      expect(timestampAccumulator.timestamp).to.be.bignumber.equal('1');
      expect(timestampAccumulator.sum).to.be.bignumber.equal('2');
    });
  });

  describe('increment', function () {
    it('fails when no time has passed', async function () {
      await expectRevert(this.accumulators.increment(0, 0), 'Accumulators: no time passed');
    });

    it('fails when misused', async function () {
      await this.accumulators.prepareForFailingTestUNSAFE();
      await expectRevert.unspecified(this.accumulators.increment(1, 1));
    });

    it('can add for 1 second', async function () {
      await this.accumulators.increment(1, 11);
      const timestampAccumulator = await this.accumulators.timestampAccumulator();
      expect(timestampAccumulator.timestamp).to.be.bignumber.equal('1');
      expect(timestampAccumulator.sum).to.be.bignumber.equal('11');
    });

    it('can add for 2 seconds', async function () {
      await this.accumulators.increment(2, 11);
      const timestampAccumulator = await this.accumulators.timestampAccumulator();
      expect(timestampAccumulator.timestamp).to.be.bignumber.equal('2');
      expect(timestampAccumulator.sum).to.be.bignumber.equal('22');
    });
  });

  describe('getArithmeticMean', function () {
    it('fails when misused', async function () {
      await this.accumulators.initialize(1, 1);
      await expectRevert.unspecified(this.accumulators.getArithmeticMean({ timestamp: 2, sum: 0 }));
    });

    it('fails when no time has elapsed', async function () {
      await expectRevert.unspecified(this.accumulators.getArithmeticMean({ timestamp: 0, sum: 11 }));
    });

    it('works with no change', async function () {
      expect(await this.accumulators.getArithmeticMean({ timestamp: 1, sum: 0 })).to.be.bignumber.equal('0');
    });

    it('works for 1 second', async function () {
      expect(await this.accumulators.getArithmeticMean({ timestamp: 1, sum: 11 })).to.be.bignumber.equal('11');
    });

    it('works for 2 seconds', async function () {
      expect(await this.accumulators.getArithmeticMean({ timestamp: 2, sum: 22 })).to.be.bignumber.equal('11');
    });

    it('works in reverse', async function () {
      await this.accumulators.initialize(1, 11);
      expect(await this.accumulators.getArithmeticMean({ timestamp: 0, sum: 0 })).to.be.bignumber.equal('11');
    });
  });
});
