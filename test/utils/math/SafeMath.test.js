const { BN, constants, expectRevert } = require('@openzeppelin/test-helpers');
const { MAX_UINT256 } = constants;

const { expect } = require('chai');

const SafeMath = artifacts.require('$SafeMath');
const SafeMathMemoryCheck = artifacts.require('$SafeMathMemoryCheck');

function expectStruct(value, expected) {
  for (const key in expected) {
    if (BN.isBN(value[key])) {
      expect(value[key]).to.be.bignumber.equal(expected[key]);
    } else {
      expect(value[key]).to.be.equal(expected[key]);
    }
  }
}

contract('SafeMath', function () {
  beforeEach(async function () {
    this.safeMath = await SafeMath.new();
  });

  async function testCommutative(fn, lhs, rhs, expected, ...extra) {
    expect(await fn(lhs, rhs, ...extra)).to.be.bignumber.equal(expected);
    expect(await fn(rhs, lhs, ...extra)).to.be.bignumber.equal(expected);
  }

  async function testFailsCommutative(fn, lhs, rhs, reason, ...extra) {
    if (reason === undefined) {
      await expectRevert.unspecified(fn(lhs, rhs, ...extra));
      await expectRevert.unspecified(fn(rhs, lhs, ...extra));
    } else {
      await expectRevert(fn(lhs, rhs, ...extra), reason);
      await expectRevert(fn(rhs, lhs, ...extra), reason);
    }
  }

  async function testCommutativeIterable(fn, lhs, rhs, expected, ...extra) {
    expectStruct(await fn(lhs, rhs, ...extra), expected);
    expectStruct(await fn(rhs, lhs, ...extra), expected);
  }

  describe('with flag', function () {
    describe('add', function () {
      it('adds correctly', async function () {
        const a = new BN('5678');
        const b = new BN('1234');

        testCommutativeIterable(this.safeMath.$tryAdd, a, b, [true, a.add(b)]);
      });

      it('reverts on addition overflow', async function () {
        const a = MAX_UINT256;
        const b = new BN('1');

        testCommutativeIterable(this.safeMath.$tryAdd, a, b, [false, '0']);
      });
    });

    describe('sub', function () {
      it('subtracts correctly', async function () {
        const a = new BN('5678');
        const b = new BN('1234');

        expectStruct(await this.safeMath.$trySub(a, b), [true, a.sub(b)]);
      });

      it('reverts if subtraction result would be negative', async function () {
        const a = new BN('1234');
        const b = new BN('5678');

        expectStruct(await this.safeMath.$trySub(a, b), [false, '0']);
      });
    });

    describe('mul', function () {
      it('multiplies correctly', async function () {
        const a = new BN('1234');
        const b = new BN('5678');

        testCommutativeIterable(this.safeMath.$tryMul, a, b, [true, a.mul(b)]);
      });

      it('multiplies by zero correctly', async function () {
        const a = new BN('0');
        const b = new BN('5678');

        testCommutativeIterable(this.safeMath.$tryMul, a, b, [true, a.mul(b)]);
      });

      it('reverts on multiplication overflow', async function () {
        const a = MAX_UINT256;
        const b = new BN('2');

        testCommutativeIterable(this.safeMath.$tryMul, a, b, [false, '0']);
      });
    });

    describe('div', function () {
      it('divides correctly', async function () {
        const a = new BN('5678');
        const b = new BN('5678');

        expectStruct(await this.safeMath.$tryDiv(a, b), [true, a.div(b)]);
      });

      it('divides zero correctly', async function () {
        const a = new BN('0');
        const b = new BN('5678');

        expectStruct(await this.safeMath.$tryDiv(a, b), [true, a.div(b)]);
      });

      it('returns complete number result on non-even division', async function () {
        const a = new BN('7000');
        const b = new BN('5678');

        expectStruct(await this.safeMath.$tryDiv(a, b), [true, a.div(b)]);
      });

      it('reverts on division by zero', async function () {
        const a = new BN('5678');
        const b = new BN('0');

        expectStruct(await this.safeMath.$tryDiv(a, b), [false, '0']);
      });
    });

    describe('mod', function () {
      describe('modulos correctly', async function () {
        it('when the dividend is smaller than the divisor', async function () {
          const a = new BN('284');
          const b = new BN('5678');

          expectStruct(await this.safeMath.$tryMod(a, b), [true, a.mod(b)]);
        });

        it('when the dividend is equal to the divisor', async function () {
          const a = new BN('5678');
          const b = new BN('5678');

          expectStruct(await this.safeMath.$tryMod(a, b), [true, a.mod(b)]);
        });

        it('when the dividend is larger than the divisor', async function () {
          const a = new BN('7000');
          const b = new BN('5678');

          expectStruct(await this.safeMath.$tryMod(a, b), [true, a.mod(b)]);
        });

        it('when the dividend is a multiple of the divisor', async function () {
          const a = new BN('17034'); // 17034 == 5678 * 3
          const b = new BN('5678');

          expectStruct(await this.safeMath.$tryMod(a, b), [true, a.mod(b)]);
        });
      });

      it('reverts with a 0 divisor', async function () {
        const a = new BN('5678');
        const b = new BN('0');

        expectStruct(await this.safeMath.$tryMod(a, b), [false, '0']);
      });
    });
  });

  describe('with default revert message', function () {
    describe('add', function () {
      it('adds correctly', async function () {
        const a = new BN('5678');
        const b = new BN('1234');

        await testCommutative(this.safeMath.$add, a, b, a.add(b));
      });

      it('reverts on addition overflow', async function () {
        const a = MAX_UINT256;
        const b = new BN('1');

        await testFailsCommutative(this.safeMath.$add, a, b, undefined);
      });
    });

    describe('sub', function () {
      it('subtracts correctly', async function () {
        const a = new BN('5678');
        const b = new BN('1234');

        expect(await this.safeMath.$sub(a, b)).to.be.bignumber.equal(a.sub(b));
      });

      it('reverts if subtraction result would be negative', async function () {
        const a = new BN('1234');
        const b = new BN('5678');

        await expectRevert.unspecified(this.safeMath.$sub(a, b));
      });
    });

    describe('mul', function () {
      it('multiplies correctly', async function () {
        const a = new BN('1234');
        const b = new BN('5678');

        await testCommutative(this.safeMath.$mul, a, b, a.mul(b));
      });

      it('multiplies by zero correctly', async function () {
        const a = new BN('0');
        const b = new BN('5678');

        await testCommutative(this.safeMath.$mul, a, b, '0');
      });

      it('reverts on multiplication overflow', async function () {
        const a = MAX_UINT256;
        const b = new BN('2');

        await testFailsCommutative(this.safeMath.$mul, a, b, undefined);
      });
    });

    describe('div', function () {
      it('divides correctly', async function () {
        const a = new BN('5678');
        const b = new BN('5678');

        expect(await this.safeMath.$div(a, b)).to.be.bignumber.equal(a.div(b));
      });

      it('divides zero correctly', async function () {
        const a = new BN('0');
        const b = new BN('5678');

        expect(await this.safeMath.$div(a, b)).to.be.bignumber.equal('0');
      });

      it('returns complete number result on non-even division', async function () {
        const a = new BN('7000');
        const b = new BN('5678');

        expect(await this.safeMath.$div(a, b)).to.be.bignumber.equal('1');
      });

      it('reverts on division by zero', async function () {
        const a = new BN('5678');
        const b = new BN('0');

        await expectRevert.unspecified(this.safeMath.$div(a, b));
      });
    });

    describe('mod', function () {
      describe('modulos correctly', async function () {
        it('when the dividend is smaller than the divisor', async function () {
          const a = new BN('284');
          const b = new BN('5678');

          expect(await this.safeMath.$mod(a, b)).to.be.bignumber.equal(a.mod(b));
        });

        it('when the dividend is equal to the divisor', async function () {
          const a = new BN('5678');
          const b = new BN('5678');

          expect(await this.safeMath.$mod(a, b)).to.be.bignumber.equal(a.mod(b));
        });

        it('when the dividend is larger than the divisor', async function () {
          const a = new BN('7000');
          const b = new BN('5678');

          expect(await this.safeMath.$mod(a, b)).to.be.bignumber.equal(a.mod(b));
        });

        it('when the dividend is a multiple of the divisor', async function () {
          const a = new BN('17034'); // 17034 == 5678 * 3
          const b = new BN('5678');

          expect(await this.safeMath.$mod(a, b)).to.be.bignumber.equal(a.mod(b));
        });
      });

      it('reverts with a 0 divisor', async function () {
        const a = new BN('5678');
        const b = new BN('0');

        await expectRevert.unspecified(this.safeMath.$mod(a, b));
      });
    });
  });

  describe('with custom revert message', function () {
    describe('sub', function () {
      it('subtracts correctly', async function () {
        const a = new BN('5678');
        const b = new BN('1234');

        expect(
          await this.safeMath.methods['$sub(uint256,uint256,string)'](a, b, 'MyErrorMessage'),
        ).to.be.bignumber.equal(a.sub(b));
      });

      it('reverts if subtraction result would be negative', async function () {
        const a = new BN('1234');
        const b = new BN('5678');

        await expectRevert(
          this.safeMath.methods['$sub(uint256,uint256,string)'](a, b, 'MyErrorMessage'),
          'MyErrorMessage',
        );
      });
    });

    describe('div', function () {
      it('divides correctly', async function () {
        const a = new BN('5678');
        const b = new BN('5678');

        expect(
          await this.safeMath.methods['$div(uint256,uint256,string)'](a, b, 'MyErrorMessage'),
        ).to.be.bignumber.equal(a.div(b));
      });

      it('divides zero correctly', async function () {
        const a = new BN('0');
        const b = new BN('5678');

        expect(
          await this.safeMath.methods['$div(uint256,uint256,string)'](a, b, 'MyErrorMessage'),
        ).to.be.bignumber.equal('0');
      });

      it('returns complete number result on non-even division', async function () {
        const a = new BN('7000');
        const b = new BN('5678');

        expect(
          await this.safeMath.methods['$div(uint256,uint256,string)'](a, b, 'MyErrorMessage'),
        ).to.be.bignumber.equal('1');
      });

      it('reverts on division by zero', async function () {
        const a = new BN('5678');
        const b = new BN('0');

        await expectRevert(
          this.safeMath.methods['$div(uint256,uint256,string)'](a, b, 'MyErrorMessage'),
          'MyErrorMessage',
        );
      });
    });

    describe('mod', function () {
      describe('modulos correctly', async function () {
        it('when the dividend is smaller than the divisor', async function () {
          const a = new BN('284');
          const b = new BN('5678');

          expect(
            await this.safeMath.methods['$mod(uint256,uint256,string)'](a, b, 'MyErrorMessage'),
          ).to.be.bignumber.equal(a.mod(b));
        });

        it('when the dividend is equal to the divisor', async function () {
          const a = new BN('5678');
          const b = new BN('5678');

          expect(
            await this.safeMath.methods['$mod(uint256,uint256,string)'](a, b, 'MyErrorMessage'),
          ).to.be.bignumber.equal(a.mod(b));
        });

        it('when the dividend is larger than the divisor', async function () {
          const a = new BN('7000');
          const b = new BN('5678');

          expect(
            await this.safeMath.methods['$mod(uint256,uint256,string)'](a, b, 'MyErrorMessage'),
          ).to.be.bignumber.equal(a.mod(b));
        });

        it('when the dividend is a multiple of the divisor', async function () {
          const a = new BN('17034'); // 17034 == 5678 * 3
          const b = new BN('5678');

          expect(
            await this.safeMath.methods['$mod(uint256,uint256,string)'](a, b, 'MyErrorMessage'),
          ).to.be.bignumber.equal(a.mod(b));
        });
      });

      it('reverts with a 0 divisor', async function () {
        const a = new BN('5678');
        const b = new BN('0');

        await expectRevert(
          this.safeMath.methods['$mod(uint256,uint256,string)'](a, b, 'MyErrorMessage'),
          'MyErrorMessage',
        );
      });
    });
  });

  describe('memory leakage', function () {
    beforeEach(async function () {
      this.safeMathMemoryCheck = await SafeMathMemoryCheck.new();
    });

    it('add', async function () {
      expect(await this.safeMathMemoryCheck.$addMemoryCheck()).to.be.bignumber.equal('0');
    });

    it('sub', async function () {
      expect(await this.safeMathMemoryCheck.$subMemoryCheck()).to.be.bignumber.equal('0');
    });

    it('mul', async function () {
      expect(await this.safeMathMemoryCheck.$mulMemoryCheck()).to.be.bignumber.equal('0');
    });

    it('div', async function () {
      expect(await this.safeMathMemoryCheck.$divMemoryCheck()).to.be.bignumber.equal('0');
    });

    it('mod', async function () {
      expect(await this.safeMathMemoryCheck.$modMemoryCheck()).to.be.bignumber.equal('0');
    });
  });
});
