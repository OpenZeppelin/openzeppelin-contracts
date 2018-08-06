const MathMock = artifacts.require('MathMock');

contract('Math', function () {
  beforeEach(async function () {
    this.math = await MathMock.new();
  });

  it('returns max correctly', async function () {
    const a = 5678;
    const b = 1234;
    const result = await this.math.max(a, b);
    assert.equal(result, a);
  });

  it('returns min correctly', async function () {
    const a = 5678;
    const b = 1234;
    const result = await this.math.min(a, b);

    assert.equal(result, b);
  });
});
