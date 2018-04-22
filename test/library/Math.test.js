var MathMock = artifacts.require('MathMock');

contract('Math', function (accounts) {
  let math;

  before(async function () {
    math = await MathMock.new();
  });

  it('returns max64 correctly', async function () {
    let a = 5678;
    let b = 1234;
    await math.max64(a, b);
    let result = await math.result64();
    assert.equal(result, a);
  });

  it('returns min64 correctly', async function () {
    let a = 5678;
    let b = 1234;
    await math.min64(a, b);
    let result = await math.result64();

    assert.equal(result, b);
  });

  it('returns max256 correctly', async function () {
    let a = 5678;
    let b = 1234;
    await math.max256(a, b);
    let result = await math.result256();
    assert.equal(result, a);
  });

  it('returns min256 correctly', async function () {
    let a = 5678;
    let b = 1234;
    await math.min256(a, b);
    let result = await math.result256();

    assert.equal(result, b);
  });
});
