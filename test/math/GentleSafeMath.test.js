const { assertRevert } = require('../helpers/assertRevert');
const BigNumber = web3.BigNumber;
const GentleSafeMathMock = artifacts.require('GentleSafeMathMock');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('GentleSafeMath', () => {
  const MAX_UINT = new BigNumber('115792089237316195423570985008687907853269984665640564039457584007913129639935');

  beforeEach(async function () {
    this.safeMath = await GentleSafeMathMock.new();
  });

  describe('add', function () {
    it('adds correctly', async function () {
      const a = new BigNumber(5678);
      const b = new BigNumber(1234);

      const result = await this.safeMath.add(a, b);
      result.should.be.bignumber.equal(a.plus(b));
    });

    it('throws an revert error on addition overflow', async function () {
      const a = MAX_UINT;
      const b = new BigNumber(1);

      await assertRevert(this.safeMath.add(a, b));
    });
  });

  describe('sub', function () {
    it('subtracts correctly', async function () {
      const a = new BigNumber(5678);
      const b = new BigNumber(1234);

      const result = await this.safeMath.sub(a, b);
      result.should.be.bignumber.equal(a.minus(b));
    });

    it('throws an revert error if subtraction result would be negative', async function () {
      const a = new BigNumber(1234);
      const b = new BigNumber(5678);

      await assertRevert(this.safeMath.sub(a, b));
    });
  });

  describe('mul', function () {
    it('multiplies correctly', async function () {
      const a = new BigNumber(1234);
      const b = new BigNumber(5678);

      const result = await this.safeMath.mul(a, b);
      result.should.be.bignumber.equal(a.times(b));
    });

    it('handles a zero product correctly', async function () {
      const a = new BigNumber(0);
      const b = new BigNumber(5678);

      const result = await this.safeMath.mul(a, b);
      result.should.be.bignumber.equal(a.times(b));
    });

    it('throws an revert error on multiplication overflow', async function () {
      const a = MAX_UINT;
      const b = new BigNumber(2);

      await assertRevert(this.safeMath.mul(a, b));
    });
  });

  describe('div', function () {
    it('divides correctly', async function () {
      const a = new BigNumber(5678);
      const b = new BigNumber(5678);

      const result = await this.safeMath.div(a, b);
      result.should.be.bignumber.equal(a.div(b));
    });

    it('throws an revert error on zero division', async function () {
      const a = new BigNumber(5678);
      const b = new BigNumber(0);

      await assertRevert(this.safeMath.div(a, b));
    });
  });
});
