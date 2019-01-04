const shouldFail = require('../helpers/shouldFail');
const { MIN_INT256, MAX_INT256 } = require('../helpers/constants');

const SignedSafeMathMock = artifacts.require('SignedSafeMathMock');

const { BigNumber } = require('../helpers/setup');

contract('SignedSafeMath', function () {
  beforeEach(async function () {
    this.safeMath = await SignedSafeMathMock.new();
  });

  describe('add', function () {
    it('adds correctly if it does not overflow and the result is positve', async function () {
      const a = new BigNumber(1234);
      const b = new BigNumber(5678);

      (await this.safeMath.add(a, b)).should.be.bignumber.equal(a.plus(b));
    });

    it('adds correctly if it does not overflow and the result is negative', async function () {
      const a = MAX_INT256;
      const b = MIN_INT256;

      const result = await this.safeMath.add(a, b);
      result.should.be.bignumber.equal(a.plus(b));
    });

    it('reverts on positive addition overflow', async function () {
      const a = MAX_INT256;
      const b = new BigNumber(1);

      await shouldFail.reverting(this.safeMath.add(a, b));
    });

    it('reverts on negative addition overflow', async function () {
      const a = MIN_INT256;
      const b = new BigNumber(-1);

      await shouldFail.reverting(this.safeMath.add(a, b));
    });
  });

  describe('sub', function () {
    it('subtracts correctly if it does not overflow and the result is positive', async function () {
      const a = new BigNumber(5678);
      const b = new BigNumber(1234);

      const result = await this.safeMath.sub(a, b);
      result.should.be.bignumber.equal(a.minus(b));
    });

    it('subtracts correctly if it does not overflow and the result is negative', async function () {
      const a = new BigNumber(1234);
      const b = new BigNumber(5678);

      const result = await this.safeMath.sub(a, b);
      result.should.be.bignumber.equal(a.minus(b));
    });

    it('reverts on positive subtraction overflow', async function () {
      const a = MAX_INT256;
      const b = new BigNumber(-1);

      await shouldFail.reverting(this.safeMath.sub(a, b));
    });

    it('reverts on negative subtraction overflow', async function () {
      const a = MIN_INT256;
      const b = new BigNumber(1);

      await shouldFail.reverting(this.safeMath.sub(a, b));
    });
  });

  describe('mul', function () {
    it('multiplies correctly', async function () {
      const a = new BigNumber(5678);
      const b = new BigNumber(-1234);

      const result = await this.safeMath.mul(a, b);
      result.should.be.bignumber.equal(a.times(b));
    });

    it('handles a zero product correctly', async function () {
      const a = new BigNumber(0);
      const b = new BigNumber(5678);

      const result = await this.safeMath.mul(a, b);
      result.should.be.bignumber.equal(a.times(b));
    });

    it('reverts on multiplication overflow, positive operands', async function () {
      const a = MAX_INT256;
      const b = new BigNumber(2);

      await shouldFail.reverting(this.safeMath.mul(a, b));
    });

    it('reverts when minimum integer is multiplied by -1', async function () {
      const a = MIN_INT256;
      const b = new BigNumber(-1);

      await shouldFail.reverting(this.safeMath.mul(a, b));
    });

    it('reverts when -1 is multiplied by minimum integer', async function () {
      const a = new BigNumber(-1);
      const b = MIN_INT256;

      await shouldFail.reverting(this.safeMath.mul(a, b));
    });
  });

  describe('div', function () {
    it('divides correctly', async function () {
      const a = new BigNumber(-5678);
      const b = new BigNumber(5678);

      const result = await this.safeMath.div(a, b);
      result.should.be.bignumber.equal(a.div(b));
    });

    it('reverts on zero division', async function () {
      const a = new BigNumber(-5678);
      const b = new BigNumber(0);

      await shouldFail.reverting(this.safeMath.div(a, b));
    });

    it('reverts on overflow, negative second', async function () {
      const a = new BigNumber(MIN_INT256);
      const b = new BigNumber(-1);

      await shouldFail.reverting(this.safeMath.div(a, b));
    });
  });
});
