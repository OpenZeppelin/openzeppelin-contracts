const MathMock = artifacts.require('MathMock');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('Math', function () {
  const min = 1234;
  const max = 5678;

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
      return a.plus(b).div(2).truncated();
    }

    it('is correctly calculated with two odd numbers', async function () {
      const a = new BigNumber(57417);
      const b = new BigNumber(95431);
      (await this.math.average(a, b)).should.be.bignumber.equal(bnAverage(a, b));
    });

    it('is correctly calculated with two even numbers', async function () {
      const a = new BigNumber(42304);
      const b = new BigNumber(84346);
      (await this.math.average(a, b)).should.be.bignumber.equal(bnAverage(a, b));
    });

    it('is correctly calculated with one even and one odd number', async function () {
      const a = new BigNumber(57417);
      const b = new BigNumber(84346);
      (await this.math.average(a, b)).should.be.bignumber.equal(bnAverage(a, b));
    });
  });
});
