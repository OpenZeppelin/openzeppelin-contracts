const { BN, constants } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { MAX_UINT256 } = constants;

const Math = artifacts.require('XMath');

contract('Math', function (accounts) {
  const min = new BN('1234');
  const max = new BN('5678');

  beforeEach(async function () {
    this.math = await Math.new();
  });

  describe('max', function () {
    it('is correctly detected in first argument position', async function () {
      expect(await this.math.xmax(max, min)).to.be.bignumber.equal(max);
    });

    it('is correctly detected in second argument position', async function () {
      expect(await this.math.xmax(min, max)).to.be.bignumber.equal(max);
    });
  });

  describe('min', function () {
    it('is correctly detected in first argument position', async function () {
      expect(await this.math.xmin(min, max)).to.be.bignumber.equal(min);
    });

    it('is correctly detected in second argument position', async function () {
      expect(await this.math.xmin(max, min)).to.be.bignumber.equal(min);
    });
  });

  describe('average', function () {
    function bnAverage (a, b) {
      return a.add(b).divn(2);
    }

    it('is correctly calculated with two odd numbers', async function () {
      const a = new BN('57417');
      const b = new BN('95431');
      expect(await this.math.xaverage(a, b)).to.be.bignumber.equal(bnAverage(a, b));
    });

    it('is correctly calculated with two even numbers', async function () {
      const a = new BN('42304');
      const b = new BN('84346');
      expect(await this.math.xaverage(a, b)).to.be.bignumber.equal(bnAverage(a, b));
    });

    it('is correctly calculated with one even and one odd number', async function () {
      const a = new BN('57417');
      const b = new BN('84346');
      expect(await this.math.xaverage(a, b)).to.be.bignumber.equal(bnAverage(a, b));
    });
  });

  describe('ceilDiv', function () {
    it('does not round up on exact division', async function () {
      const a = new BN('10');
      const b = new BN('5');
      expect(await this.math.xceilDiv(a, b)).to.be.bignumber.equal('2');
    });

    it('rounds up on division with remainders', async function () {
      const a = new BN('42');
      const b = new BN('13');
      expect(await this.math.xceilDiv(a, b)).to.be.bignumber.equal('4');
    });

    it('does not overflow', async function () {
      const b = new BN('2');
      const result = new BN('1').shln(255);
      expect(await this.math.xceilDiv(MAX_UINT256, b)).to.be.bignumber.equal(result);
    });

    it('correctly computes max uint256 divided by 1', async function () {
      const b = new BN('1');
      expect(await this.math.xceilDiv(MAX_UINT256, b)).to.be.bignumber.equal(MAX_UINT256);
    });
  });
});
