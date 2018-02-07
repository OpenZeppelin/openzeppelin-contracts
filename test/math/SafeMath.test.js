import assertRevert from '../helpers/assertRevert';
const assertJump = require('../helpers/assertJump');
var SafeMathMock = artifacts.require('SafeMathMock');

contract('SafeMath', function (accounts) {
  let safeMath;

  before(async function () {
    safeMath = await SafeMathMock.new();
  });

  it('multiplies correctly', async function () {
    let a = 5678;
    let b = 1234;
    await safeMath.multiply(a, b);
    let result = await safeMath.result();
    assert.equal(result, a * b);
  });

  it('adds correctly', async function () {
    let a = 5678;
    let b = 1234;
    await safeMath.add(a, b);
    let result = await safeMath.result();

    assert.equal(result, a + b);
  });

  it('subtracts correctly', async function () {
    let a = 5678;
    let b = 1234;
    await safeMath.subtract(a, b);
    let result = await safeMath.result();

    assert.equal(result, a - b);
  });

  it('should throw an error if subtraction result would be negative', async function () {
    let a = 1234;
    let b = 5678;
    try {
      await safeMath.subtract(a, b);
      assert.fail('should have thrown before');
    } catch (error) {
      assertJump(error);
    }
  });

  it('should throw an error on addition overflow', async function () {
    let a = 115792089237316195423570985008687907853269984665640564039457584007913129639935;
    let b = 1;
    await assertRevert(safeMath.add(a, b));
  });

  it('should throw an error on multiplication overflow', async function () {
    let a = 115792089237316195423570985008687907853269984665640564039457584007913129639933;
    let b = 2;
    await assertRevert(safeMath.multiply(a, b));
  });

  describe('fxpMul', () => {
    it('should throw an error if base is 0', async function () {
      let base = 0;
      let a = 100;
      let b = 7;
      try {
        await safeMath.fxpMul(a, b, base);
        assert.fail('should have thrown before');
      } catch (error) {
        assertJump(error);
      }
    });

    it('should throw an error on multiplication overflow', async function () {
      let base = 1000000;
      let a = 115792089237316195423570985008687907853269984665640564039457584007913129639933;
      let b = 2;
      await assertRevert(safeMath.fxpMul(a, b, base));
    });

    it('should multiply fixed point decimals represented as unsigned integers correctly', async function () {
      let base = 1000000;
      let a = 100 * base;
      let b = 0.7 * base;
      await safeMath.fxpMul(a, b, base);
      let result = await safeMath.result();

      assert.equal(result, (100 * 0.7) * base);
    });
  });

  describe('fxpDiv', () => {
    it('should throw an error if divisor is 0', async function () {
      let base = 1000000;
      let a = 100;
      let b = 0;
      try {
        await safeMath.fxpDiv(a, b, base);
        assert.fail('should have thrown before');
      } catch (error) {
        assertJump(error);
      }
    });

    it('should throw an error on multiplication overflow', async function () {
      let base = 1000000;
      let a = 115792089237316195423570985008687907853269984665640564039457584007913129639933;
      let b = 2;
      await assertRevert(safeMath.fxpMul(a, b, base));
    });

    it('should divide fixed point decimals represented as unsigned integers correctly', async function () {
      let base = 1000000;
      let a = 25 * base;
      let b = 100 * base;
      await safeMath.fxpDiv(a, b, base);
      let result = await safeMath.result();

      assert.equal(result, (25 / 100) * base);
    });
  });
});
