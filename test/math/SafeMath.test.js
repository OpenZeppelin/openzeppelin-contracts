const { contract } = require('@openzeppelin/test-environment');
const { BN, constants, expectRevert } = require('@openzeppelin/test-helpers');
const { MAX_UINT256 } = constants;

const { expect } = require('chai');

const SafeMathMock = contract.fromArtifact('SafeMathMock');

describe('SafeMath', function () {
  beforeEach(async function () {
    this.safeMath = await SafeMathMock.new();
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
    it('adds correctly', async function () {
      const a = new BN('5678');
      const b = new BN('1234');

      await testCommutative(this.safeMath.add, a, b, a.add(b));
    });

    it('reverts on addition overflow', async function () {
      const a = MAX_UINT256;
      const b = new BN('1');

      await testFailsCommutative(this.safeMath.add, a, b, 'SafeMath: addition overflow');
    });
  });

  describe('sub', function () {
    it('subtracts correctly', async function () {
      const a = new BN('5678');
      const b = new BN('1234');

      expect(await this.safeMath.sub(a, b)).to.be.bignumber.equal(a.sub(b));
    });

    it('reverts if subtraction result would be negative', async function () {
      const a = new BN('1234');
      const b = new BN('5678');

      await expectRevert(this.safeMath.sub(a, b), 'SafeMath: subtraction overflow');
    });
  });

  describe('mul', function () {
    it('multiplies correctly', async function () {
      const a = new BN('1234');
      const b = new BN('5678');

      await testCommutative(this.safeMath.mul, a, b, a.mul(b));
    });

    it('multiplies by zero correctly', async function () {
      const a = new BN('0');
      const b = new BN('5678');

      await testCommutative(this.safeMath.mul, a, b, '0');
    });

    it('reverts on multiplication overflow', async function () {
      const a = MAX_UINT256;
      const b = new BN('2');

      await testFailsCommutative(this.safeMath.mul, a, b, 'SafeMath: multiplication overflow');
    });
  });

  describe('div', function () {
    it('divides correctly', async function () {
      const a = new BN('5678');
      const b = new BN('5678');

      expect(await this.safeMath.div(a, b)).to.be.bignumber.equal(a.div(b));
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
      const a = new BN('5678');
      const b = new BN('0');

      await expectRevert(this.safeMath.div(a, b), 'SafeMath: division by zero');
    });
  });

  describe('mod', function () {
    describe('modulos correctly', async function () {
      it('when the dividend is smaller than the divisor', async function () {
        const a = new BN('284');
        const b = new BN('5678');

        expect(await this.safeMath.mod(a, b)).to.be.bignumber.equal(a.mod(b));
      });

      it('when the dividend is equal to the divisor', async function () {
        const a = new BN('5678');
        const b = new BN('5678');

        expect(await this.safeMath.mod(a, b)).to.be.bignumber.equal(a.mod(b));
      });

      it('when the dividend is larger than the divisor', async function () {
        const a = new BN('7000');
        const b = new BN('5678');

        expect(await this.safeMath.mod(a, b)).to.be.bignumber.equal(a.mod(b));
      });

      it('when the dividend is a multiple of the divisor', async function () {
        const a = new BN('17034'); // 17034 == 5678 * 3
        const b = new BN('5678');

        expect(await this.safeMath.mod(a, b)).to.be.bignumber.equal(a.mod(b));
      });
    });

    it('reverts with a 0 divisor', async function () {
      const a = new BN('5678');
      const b = new BN('0');

      await expectRevert(this.safeMath.mod(a, b), 'SafeMath: modulo by zero');
    });
  });
});
