const { BN, constants, shouldFail } = require('openzeppelin-test-helpers');
const { MAX_INT256, MIN_INT256 } = constants;

const SignedSafeMathMock = artifacts.require('SignedSafeMathMock');

contract('SignedSafeMath', function () {
  beforeEach(async function () {
    this.safeMath = await SignedSafeMathMock.new();
  });

  async function testCommutative (fn, lhs, rhs, expected) {
    (await fn(lhs, rhs)).should.be.bignumber.equal(expected);
    (await fn(rhs, lhs)).should.be.bignumber.equal(expected);
  }

  async function testFailsCommutative (fn, lhs, rhs) {
    await shouldFail.reverting(fn(lhs, rhs));
    await shouldFail.reverting(fn(rhs, lhs));
  }

  describe('add', function () {
    it('adds correctly if it does not overflow and the result is positve', async function () {
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

      await testFailsCommutative(this.safeMath.add, a, b);
    });

    it('reverts on negative addition overflow', async function () {
      const a = MIN_INT256;
      const b = new BN('-1');

      await testFailsCommutative(this.safeMath.add, a, b);
    });
  });

  describe('sub', function () {
    it('subtracts correctly if it does not overflow and the result is positive', async function () {
      const a = new BN('5678');
      const b = new BN('1234');

      const result = await this.safeMath.sub(a, b);
      result.should.be.bignumber.equal(a.sub(b));
    });

    it('subtracts correctly if it does not overflow and the result is negative', async function () {
      const a = new BN('1234');
      const b = new BN('5678');

      const result = await this.safeMath.sub(a, b);
      result.should.be.bignumber.equal(a.sub(b));
    });

    it('reverts on positive subtraction overflow', async function () {
      const a = MAX_INT256;
      const b = new BN('-1');

      await shouldFail.reverting(this.safeMath.sub(a, b));
    });

    it('reverts on negative subtraction overflow', async function () {
      const a = MIN_INT256;
      const b = new BN('1');

      await shouldFail.reverting(this.safeMath.sub(a, b));
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

      await testFailsCommutative(this.safeMath.mul, a, b);
    });

    it('reverts when minimum integer is multiplied by -1', async function () {
      const a = MIN_INT256;
      const b = new BN('-1');

      await testFailsCommutative(this.safeMath.mul, a, b);
    });
  });

  describe('div', function () {
    it('divides correctly', async function () {
      const a = new BN('-5678');
      const b = new BN('5678');

      const result = await this.safeMath.div(a, b);
      result.should.be.bignumber.equal(a.div(b));
    });

    it('divides zero correctly', async function () {
      const a = new BN('0');
      const b = new BN('5678');

      (await this.safeMath.div(a, b)).should.be.bignumber.equal('0');
    });

    it('returns complete number result on non-even division', async function () {
      const a = new BN('7000');
      const b = new BN('5678');

      (await this.safeMath.div(a, b)).should.be.bignumber.equal('1');
    });

    it('reverts on division by zero', async function () {
      const a = new BN('-5678');
      const b = new BN('0');

      await shouldFail.reverting(this.safeMath.div(a, b));
    });

    it('reverts on overflow, negative second', async function () {
      const a = new BN(MIN_INT256);
      const b = new BN('-1');

      await shouldFail.reverting(this.safeMath.div(a, b));
    });
  });
});
