const MathMock = artifacts.require('MathMock');

contract('Math', function () {
  const min = 1234;
  const max = 5678;

  beforeEach(async function () {
    this.math = await MathMock.new();
  });

  describe('max', function () {
    it('is correctly detected in first argument position', async function () {
      const result = await this.math.max(max, min);
      assert.equal(result, max);
    });

    it('is correctly detected in second argument position', async function () {
      const result = await this.math.max(min, max);
      assert.equal(result, max);
    });
  });

  describe('min', function () {
    it('is correctly detected in first argument position', async function () {
      const result = await this.math.min(min, max);
      assert.equal(result, min);
    });

    it('is correctly detected in second argument position', async function () {
      const result = await this.math.min(max, min);
      assert.equal(result, min);
    });
  });
});
