const MathMock = artifacts.require('MathMock');

contract('Math', function () {
  let math;

  beforeEach(async function () {
    math = await MathMock.new();
  });

  it('returns max correctly', async function () {
    const a = 5678;
    const b = 1234;
    await math.max(a, b);
    const result = await math.result();
    assert.equal(result, a);
  });

  it('returns min correctly', async function () {
    const a = 5678;
    const b = 1234;
    await math.min(a, b);
    const result = await math.result();

    assert.equal(result, b);
  });
});
