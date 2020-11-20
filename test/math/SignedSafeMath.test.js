const { BN, constants, expectRevert } = require('@openzeppelin/test-helpers');
const { MAX_INT256, MIN_INT256 } = constants;

const { expect } = require('chai');

const SignedSafeMathMock = artifacts.require('SignedSafeMathMock');

contract('SignedSafeMath', function (accounts) {
  beforeEach(async function () {
    this.safeMath = await SignedSafeMathMock.new();
  });

  async function testCommutative (fn, lhs, rhs, expected) {
    expect(await fn(lhs, rhs)).to.be.bignumber.equal(expected);
    expect(await fn(rhs, lhs)).to.be.bignumber.equal(expected);
  }

  async function testFailsCommutative (fn, lhs, rhs, reason) {
    await expectRevert(fn(lhs, rhs), reason);
    await expectRevert(fn(rhs, lhs), reason);
  }

  describe('add', function () {
    it('adds correctly if it does not overflow and the result is positive', async function () {
      const a = new BN('1234');
      const b = new BN('5678');

      await testCommutative(this.safeMath.add, a, b, a.add(b));
    });

    it('adds correctly if it does not overflow and the result is negative', async function () {
      const a = MAX_INT256;
      const b = MIN_INT256;

      await testCommutative(this.safeMath.add, a, b, a.add(b));
    });

    it('reverts on positive addition overflow', async function () {
      const a = MAX_INT256;
      const b = new BN('1');

      await testFailsCommutative(this.safeMath.add, a, b, 'SignedSafeMath: addition overflow');
    });

    it('reverts on negative addition overflow', async function () {
      const a = MIN_INT256;
      const b = new BN('-1');

      await testFailsCommutative(this.safeMath.add, a, b, 'SignedSafeMath: addition overflow');
    });
  });

  describe('sub', function () {
    it('subtracts correctly if it does not overflow and the result is positive', async function () {
      const a = new BN('5678');
      const b = new BN('1234');

      const result = await this.safeMath.sub(a, b);
      expect(result).to.be.bignumber.equal(a.sub(b));
    });

    it('subtracts correctly if it does not overflow and the result is negative', async function () {
      const a = new BN('1234');
      const b = new BN('5678');

      const result = await this.safeMath.sub(a, b);
      expect(result).to.be.bignumber.equal(a.sub(b));
    });

    it('reverts on positive subtraction overflow', async function () {
      const a = MAX_INT256;
      const b = new BN('-1');

      await expectRevert(this.safeMath.sub(a, b), 'SignedSafeMath: subtraction overflow');
    });

    it('reverts on negative subtraction overflow', async function () {
      const a = MIN_INT256;
      const b = new BN('1');

      await expectRevert(this.safeMath.sub(a, b), 'SignedSafeMath: subtraction overflow');
    });
  });

  describe('mul', function () {
    it('multiplies correctly', async function () {
      const a = new BN('5678');
      const b = new BN('-1234');

      await testCommutative(this.safeMath.mul, a, b, a.mul(b));
    });

    it('multiplies by zero correctly', async function () {
      const a = new BN('0');
      const b = new BN('5678');

      await testCommutative(this.safeMath.mul, a, b, '0');
    });

    it('reverts on multiplication overflow, positive operands', async function () {
      const a = MAX_INT256;
      const b = new BN('2');

      await testFailsCommutative(this.safeMath.mul, a, b, 'SignedSafeMath: multiplication overflow');
    });

    it('reverts when minimum integer is multiplied by -1', async function () {
      const a = MIN_INT256;
      const b = new BN('-1');

      await testFailsCommutative(this.safeMath.mul, a, b, 'SignedSafeMath: multiplication overflow');
    });
  });

  describe('div', function () {
    it('divides correctly', async function () {
      const a = new BN('-5678');
      const b = new BN('5678');

      const result = await this.safeMath.div(a, b);
      expect(result).to.be.bignumber.equal(a.div(b));
    });

    it('divides zero correctly', async function () {
      const a = new BN('0');
      const b = new BN('5678');

      expect(await this.safeMath.div(a, b)).to.be.bignumber.equal('0');
    });

    it('returns complete number result on non-even division', async function () {
      const a = new BN('7000');
      const b = new BN('5678');

      expect(await this.safeMath.div(a, b)).to.be.bignumber.equal('1');
    });

    it('reverts on division by zero', async function () {
      const a = new BN('-5678');
      const b = new BN('0');

      await expectRevert(this.safeMath.div(a, b), 'SignedSafeMath: division by zero');
    });

    it('reverts on overflow, negative second', async function () {
      const a = new BN(MIN_INT256);
      const b = new BN('-1');

      await expectRevert(this.safeMath.div(a, b), 'SignedSafeMath: division overflow');
    });
  });
});
