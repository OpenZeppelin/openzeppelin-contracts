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
      const result = await this.math.max(max, min);
      result.should.be.bignumber.equal(max);
    });

    it('is correctly detected in second argument position', async function () {
      const result = await this.math.max(min, max);
      result.should.be.bignumber.equal(max);
    });
  });

  describe('min', function () {
    it('is correctly detected in first argument position', async function () {
      const result = await this.math.min(min, max);
      result.should.be.bignumber.equal(min);
    });

    it('is correctly detected in second argument position', async function () {
      const result = await this.math.min(max, min);
      result.should.be.bignumber.equal(min);
    });
  });
});
