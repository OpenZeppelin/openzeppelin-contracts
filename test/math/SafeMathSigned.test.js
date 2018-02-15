import assertRevert from '../helpers/assertRevert';

var SafeMathSignedMock = artifacts.require('SafeMathSignedMock');

contract('SafeMathSigned', function (accounts) {
  let safeMath;

  before(async function () {
    safeMath = await SafeMathSignedMock.new();
  });

  it('multiplies correctly', async function () {
    let a = 5678;
    let b = -1234;
    await safeMath.multiply(a, b);
    let result = await safeMath.result();
    assert.equal(result, a * b);
  });

  it('adds correctly', async function () {
    let a = 5678;
    let b = -1234;
    await safeMath.add(a, b);
    let result = await safeMath.result();

    assert.equal(result, a + b);
  });

  it('subtracts correctly', async function () {
    let a = -5678;
    let b = 1234;
    await safeMath.subtract(a, b);
    let result = await safeMath.result();

    assert.equal(result, a - b);
  });

  it('should throw an error on addition overflow positive boundaries', async function () {
    let a = 2 ** 256;
    let b = 1;
    await assertRevert(safeMath.add(a, b));
  });

  it('should throw an error on addition overflow negative boundaries', async function () {
    let a = 2 ** 256;
    let b = 1;
    await assertRevert(safeMath.add(-a, -b));
  });

  it('should throw an error on multiplication overflow', async function () {
    let a = 2 ** 256;
    let b = 2;
    await assertRevert(safeMath.multiply(a, b));
  });

  it('should throw an error on multiplication overflow', async function () {
    let a = 2 ** 256;
    let b = 2;
    await assertRevert(safeMath.multiply(a, b));
  });
});
