const { BN, constants } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { MAX_UINT256, MAX_INT256, MIN_INT256 } = constants;

const MathMock = artifacts.require('MathMock');

contract('Math', function (accounts) {
  const min = new BN('1234');
  const max = new BN('5678');

  beforeEach(async function () {
    this.math = await MathMock.new();
  });

  describe('max', function () {
    it('is correctly detected in first argument position', async function () {
      expect(await this.math.max(max, min)).to.be.bignumber.equal(max);
    });

    it('is correctly detected in second argument position', async function () {
      expect(await this.math.max(min, max)).to.be.bignumber.equal(max);
    });
  });

  describe('min', function () {
    it('is correctly detected in first argument position', async function () {
      expect(await this.math.min(min, max)).to.be.bignumber.equal(min);
    });

    it('is correctly detected in second argument position', async function () {
      expect(await this.math.min(max, min)).to.be.bignumber.equal(min);
    });
  });

  describe('average', function () {
    function bnAverage (a, b) {
      return a.add(b).divn(2);
    }

    it('is correctly calculated with two odd numbers', async function () {
      const a = new BN('57417');
      const b = new BN('95431');
      expect(await this.math.average(a, b)).to.be.bignumber.equal(bnAverage(a, b));
    });

    it('is correctly calculated with two even numbers', async function () {
      const a = new BN('42304');
      const b = new BN('84346');
      expect(await this.math.average(a, b)).to.be.bignumber.equal(bnAverage(a, b));
    });

    it('is correctly calculated with one even and one odd number', async function () {
      const a = new BN('57417');
      const b = new BN('84346');
      expect(await this.math.average(a, b)).to.be.bignumber.equal(bnAverage(a, b));
    });

    it('is correctly calculated with two max uint256 numbers', async function () {
      const a = MAX_UINT256;
      expect(await this.math.average(a, a)).to.be.bignumber.equal(bnAverage(a, a));
    });
  });

  describe('ceilDiv', function () {
    it('does not round up on exact division', async function () {
      const a = new BN('10');
      const b = new BN('5');
      expect(await this.math.ceilDiv(a, b)).to.be.bignumber.equal('2');
    });

    it('rounds up on division with remainders', async function () {
      const a = new BN('42');
      const b = new BN('13');
      expect(await this.math.ceilDiv(a, b)).to.be.bignumber.equal('4');
    });

    it('does not overflow', async function () {
      const b = new BN('2');
      const result = new BN('1').shln(255);
      expect(await this.math.ceilDiv(MAX_UINT256, b)).to.be.bignumber.equal(result);
    });

    it('correctly computes max uint256 divided by 1', async function () {
      const b = new BN('1');
      expect(await this.math.ceilDiv(MAX_UINT256, b)).to.be.bignumber.equal(MAX_UINT256);
    });
  });

  describe('abs', function () {
    for (const n of [
      MIN_INT256,
      MIN_INT256.addn(1),
      new BN('-1'),
      new BN('0'),
      new BN('1'),
      MAX_INT256.subn(1),
      MAX_INT256,
    ]) {
      it(`correctly computes the absolute value of ${n}`, async function () {
        expect(await this.math.abs(n)).to.be.bignumber.equal(n.abs());
      });
    }
  });
});
