var MathMock = artifacts.require('MathMock');

contract('Math', function (accounts) {
  let math;

  before(async function () {
    math = await MathMock.new();
  });

  it('returns max correctly', async function () {
    let a = 5678;
    let b = 1234;
    await math.max64(a, b);
    let result = await math.result();
    assert.equal(result, a);
  });

  it('returns min correctly', async function () {
    let a = 5678;
    let b = 1234;
    await math.min64(a, b);
    let result = await math.result();
    assert.equal(result, b);
  });
});
