const { BN } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

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
  });
});
