const { BN } = require('openzeppelin-test-helpers');

const MathMock = artifacts.require('MathMock');

contract('Math', function () {
  const min = new BN('1234');
  const max = new BN('5678');

  beforeEach(async function () {
    this.math = await MathMock.new();
  });

  describe('max', function () {
    it('is correctly detected in first argument position', async function () {
      (await this.math.max(max, min)).should.be.bignumber.equal(max);
    });

    it('is correctly detected in second argument position', async function () {
      (await this.math.max(min, max)).should.be.bignumber.equal(max);
    });
  });

  describe('min', function () {
    it('is correctly detected in first argument position', async function () {
      (await this.math.min(min, max)).should.be.bignumber.equal(min);
    });

    it('is correctly detected in second argument position', async function () {
      (await this.math.min(max, min)).should.be.bignumber.equal(min);
    });
  });

  describe('average', function () {
    function bnAverage (a, b) {
      return a.add(b).divn(2);
    }

    it('is correctly calculated with two odd numbers', async function () {
      const a = new BN('57417');
      const b = new BN('95431');
      (await this.math.average(a, b)).should.be.bignumber.equal(bnAverage(a, b));
    });

    it('is correctly calculated with two even numbers', async function () {
      const a = new BN('42304');
      const b = new BN('84346');
      (await this.math.average(a, b)).should.be.bignumber.equal(bnAverage(a, b));
    });

    it('is correctly calculated with one even and one odd number', async function () {
      const a = new BN('57417');
      const b = new BN('84346');
      (await this.math.average(a, b)).should.be.bignumber.equal(bnAverage(a, b));
    });
  });
});
