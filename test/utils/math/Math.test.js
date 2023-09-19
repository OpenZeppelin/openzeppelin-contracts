const { BN, constants, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { MAX_UINT256 } = constants;
const { Rounding } = require('../../helpers/enums.js');
const { expectRevertCustomError } = require('../../helpers/customError.js');

const Math = artifacts.require('$Math');

const RoundingDown = [Rounding.Floor, Rounding.Trunc];
const RoundingUp = [Rounding.Ceil, Rounding.Expand];

function expectStruct(value, expected) {
  for (const key in expected) {
    if (BN.isBN(value[key])) {
      expect(value[key]).to.be.bignumber.equal(expected[key]);
    } else {
      expect(value[key]).to.be.equal(expected[key]);
    }
  }
}

async function testCommutativeIterable(fn, lhs, rhs, expected, ...extra) {
  expectStruct(await fn(lhs, rhs, ...extra), expected);
  expectStruct(await fn(rhs, lhs, ...extra), expected);
}

contract('Math', function () {
  const min = new BN('1234');
  const max = new BN('5678');
  const MAX_UINT256_SUB1 = MAX_UINT256.sub(new BN('1'));
  const MAX_UINT256_SUB2 = MAX_UINT256.sub(new BN('2'));

  beforeEach(async function () {
    this.math = await Math.new();
  });

  describe('tryAdd', function () {
    it('adds correctly', async function () {
      const a = new BN('5678');
      const b = new BN('1234');

      await testCommutativeIterable(this.math.$tryAdd, a, b, [true, a.add(b)]);
    });

    it('reverts on addition overflow', async function () {
      const a = MAX_UINT256;
      const b = new BN('1');

      await testCommutativeIterable(this.math.$tryAdd, a, b, [false, '0']);
    });
  });

  describe('trySub', function () {
    it('subtracts correctly', async function () {
      const a = new BN('5678');
      const b = new BN('1234');

      expectStruct(await this.math.$trySub(a, b), [true, a.sub(b)]);
    });

    it('reverts if subtraction result would be negative', async function () {
      const a = new BN('1234');
      const b = new BN('5678');

      expectStruct(await this.math.$trySub(a, b), [false, '0']);
    });
  });

  describe('tryMul', function () {
    it('multiplies correctly', async function () {
      const a = new BN('1234');
      const b = new BN('5678');

      await testCommutativeIterable(this.math.$tryMul, a, b, [true, a.mul(b)]);
    });

    it('multiplies by zero correctly', async function () {
      const a = new BN('0');
      const b = new BN('5678');

      await testCommutativeIterable(this.math.$tryMul, a, b, [true, a.mul(b)]);
    });

    it('reverts on multiplication overflow', async function () {
      const a = MAX_UINT256;
      const b = new BN('2');

      await testCommutativeIterable(this.math.$tryMul, a, b, [false, '0']);
    });
  });

  describe('tryDiv', function () {
    it('divides correctly', async function () {
      const a = new BN('5678');
      const b = new BN('5678');

      expectStruct(await this.math.$tryDiv(a, b), [true, a.div(b)]);
    });

    it('divides zero correctly', async function () {
      const a = new BN('0');
      const b = new BN('5678');

      expectStruct(await this.math.$tryDiv(a, b), [true, a.div(b)]);
    });

    it('returns complete number result on non-even division', async function () {
      const a = new BN('7000');
      const b = new BN('5678');

      expectStruct(await this.math.$tryDiv(a, b), [true, a.div(b)]);
    });

    it('reverts on division by zero', async function () {
      const a = new BN('5678');
      const b = new BN('0');

      expectStruct(await this.math.$tryDiv(a, b), [false, '0']);
    });
  });

  describe('tryMod', function () {
    describe('modulos correctly', async function () {
      it('when the dividend is smaller than the divisor', async function () {
        const a = new BN('284');
        const b = new BN('5678');

        expectStruct(await this.math.$tryMod(a, b), [true, a.mod(b)]);
      });

      it('when the dividend is equal to the divisor', async function () {
        const a = new BN('5678');
        const b = new BN('5678');

        expectStruct(await this.math.$tryMod(a, b), [true, a.mod(b)]);
      });

      it('when the dividend is larger than the divisor', async function () {
        const a = new BN('7000');
        const b = new BN('5678');

        expectStruct(await this.math.$tryMod(a, b), [true, a.mod(b)]);
      });

      it('when the dividend is a multiple of the divisor', async function () {
        const a = new BN('17034'); // 17034 == 5678 * 3
        const b = new BN('5678');

        expectStruct(await this.math.$tryMod(a, b), [true, a.mod(b)]);
      });
    });

    it('reverts with a 0 divisor', async function () {
      const a = new BN('5678');
      const b = new BN('0');

      expectStruct(await this.math.$tryMod(a, b), [false, '0']);
    });
  });

  describe('max', function () {
    it('is correctly detected in first argument position', async function () {
      expect(await this.math.$max(max, min)).to.be.bignumber.equal(max);
    });

    it('is correctly detected in second argument position', async function () {
      expect(await this.math.$max(min, max)).to.be.bignumber.equal(max);
    });
  });

  describe('min', function () {
    it('is correctly detected in first argument position', async function () {
      expect(await this.math.$min(min, max)).to.be.bignumber.equal(min);
    });

    it('is correctly detected in second argument position', async function () {
      expect(await this.math.$min(max, min)).to.be.bignumber.equal(min);
    });
  });

  describe('average', function () {
    function bnAverage(a, b) {
      return a.add(b).divn(2);
    }

    it('is correctly calculated with two odd numbers', async function () {
      const a = new BN('57417');
      const b = new BN('95431');
      expect(await this.math.$average(a, b)).to.be.bignumber.equal(bnAverage(a, b));
    });

    it('is correctly calculated with two even numbers', async function () {
      const a = new BN('42304');
      const b = new BN('84346');
      expect(await this.math.$average(a, b)).to.be.bignumber.equal(bnAverage(a, b));
    });

    it('is correctly calculated with one even and one odd number', async function () {
      const a = new BN('57417');
      const b = new BN('84346');
      expect(await this.math.$average(a, b)).to.be.bignumber.equal(bnAverage(a, b));
    });

    it('is correctly calculated with two max uint256 numbers', async function () {
      const a = MAX_UINT256;
      expect(await this.math.$average(a, a)).to.be.bignumber.equal(bnAverage(a, a));
    });
  });

  describe('ceilDiv', function () {
    it('reverts on zero division', async function () {
      const a = new BN('2');
      const b = new BN('0');
      // It's unspecified because it's a low level 0 division error
      await expectRevert.unspecified(this.math.$ceilDiv(a, b));
    });

    it('does not round up a zero result', async function () {
      const a = new BN('0');
      const b = new BN('2');
      expect(await this.math.$ceilDiv(a, b)).to.be.bignumber.equal('0');
    });

    it('does not round up on exact division', async function () {
      const a = new BN('10');
      const b = new BN('5');
      expect(await this.math.$ceilDiv(a, b)).to.be.bignumber.equal('2');
    });

    it('rounds up on division with remainders', async function () {
      const a = new BN('42');
      const b = new BN('13');
      expect(await this.math.$ceilDiv(a, b)).to.be.bignumber.equal('4');
    });

    it('does not overflow', async function () {
      const b = new BN('2');
      const result = new BN('1').shln(255);
      expect(await this.math.$ceilDiv(MAX_UINT256, b)).to.be.bignumber.equal(result);
    });

    it('correctly computes max uint256 divided by 1', async function () {
      const b = new BN('1');
      expect(await this.math.$ceilDiv(MAX_UINT256, b)).to.be.bignumber.equal(MAX_UINT256);
    });
  });

  describe('muldiv', function () {
    it('divide by 0', async function () {
      await expectRevert.unspecified(this.math.$mulDiv(1, 1, 0, Rounding.Floor));
    });

    it('reverts with result higher than 2 ^ 256', async function () {
      await expectRevertCustomError(this.math.$mulDiv(5, MAX_UINT256, 2, Rounding.Floor), 'MathOverflowedMulDiv', []);
    });

    describe('does round down', async function () {
      it('small values', async function () {
        for (const rounding of RoundingDown) {
          expect(await this.math.$mulDiv('3', '4', '5', rounding)).to.be.bignumber.equal('2');
          expect(await this.math.$mulDiv('3', '5', '5', rounding)).to.be.bignumber.equal('3');
        }
      });

      it('large values', async function () {
        for (const rounding of RoundingDown) {
          expect(await this.math.$mulDiv(new BN('42'), MAX_UINT256_SUB1, MAX_UINT256, rounding)).to.be.bignumber.equal(
            new BN('41'),
          );

          expect(await this.math.$mulDiv(new BN('17'), MAX_UINT256, MAX_UINT256, rounding)).to.be.bignumber.equal(
            new BN('17'),
          );

          expect(
            await this.math.$mulDiv(MAX_UINT256_SUB1, MAX_UINT256_SUB1, MAX_UINT256, rounding),
          ).to.be.bignumber.equal(MAX_UINT256_SUB2);

          expect(await this.math.$mulDiv(MAX_UINT256, MAX_UINT256_SUB1, MAX_UINT256, rounding)).to.be.bignumber.equal(
            MAX_UINT256_SUB1,
          );

          expect(await this.math.$mulDiv(MAX_UINT256, MAX_UINT256, MAX_UINT256, rounding)).to.be.bignumber.equal(
            MAX_UINT256,
          );
        }
      });
    });

    describe('does round up', async function () {
      it('small values', async function () {
        for (const rounding of RoundingUp) {
          expect(await this.math.$mulDiv('3', '4', '5', rounding)).to.be.bignumber.equal('3');
          expect(await this.math.$mulDiv('3', '5', '5', rounding)).to.be.bignumber.equal('3');
        }
      });

      it('large values', async function () {
        for (const rounding of RoundingUp) {
          expect(await this.math.$mulDiv(new BN('42'), MAX_UINT256_SUB1, MAX_UINT256, rounding)).to.be.bignumber.equal(
            new BN('42'),
          );

          expect(await this.math.$mulDiv(new BN('17'), MAX_UINT256, MAX_UINT256, rounding)).to.be.bignumber.equal(
            new BN('17'),
          );

          expect(
            await this.math.$mulDiv(MAX_UINT256_SUB1, MAX_UINT256_SUB1, MAX_UINT256, rounding),
          ).to.be.bignumber.equal(MAX_UINT256_SUB1);

          expect(await this.math.$mulDiv(MAX_UINT256, MAX_UINT256_SUB1, MAX_UINT256, rounding)).to.be.bignumber.equal(
            MAX_UINT256_SUB1,
          );

          expect(await this.math.$mulDiv(MAX_UINT256, MAX_UINT256, MAX_UINT256, rounding)).to.be.bignumber.equal(
            MAX_UINT256,
          );
        }
      });
    });
  });

  describe('sqrt', function () {
    it('rounds down', async function () {
      for (const rounding of RoundingDown) {
        expect(await this.math.$sqrt('0', rounding)).to.be.bignumber.equal('0');
        expect(await this.math.$sqrt('1', rounding)).to.be.bignumber.equal('1');
        expect(await this.math.$sqrt('2', rounding)).to.be.bignumber.equal('1');
        expect(await this.math.$sqrt('3', rounding)).to.be.bignumber.equal('1');
        expect(await this.math.$sqrt('4', rounding)).to.be.bignumber.equal('2');
        expect(await this.math.$sqrt('144', rounding)).to.be.bignumber.equal('12');
        expect(await this.math.$sqrt('999999', rounding)).to.be.bignumber.equal('999');
        expect(await this.math.$sqrt('1000000', rounding)).to.be.bignumber.equal('1000');
        expect(await this.math.$sqrt('1000001', rounding)).to.be.bignumber.equal('1000');
        expect(await this.math.$sqrt('1002000', rounding)).to.be.bignumber.equal('1000');
        expect(await this.math.$sqrt('1002001', rounding)).to.be.bignumber.equal('1001');
        expect(await this.math.$sqrt(MAX_UINT256, rounding)).to.be.bignumber.equal(
          '340282366920938463463374607431768211455',
        );
      }
    });

    it('rounds up', async function () {
      for (const rounding of RoundingUp) {
        expect(await this.math.$sqrt('0', rounding)).to.be.bignumber.equal('0');
        expect(await this.math.$sqrt('1', rounding)).to.be.bignumber.equal('1');
        expect(await this.math.$sqrt('2', rounding)).to.be.bignumber.equal('2');
        expect(await this.math.$sqrt('3', rounding)).to.be.bignumber.equal('2');
        expect(await this.math.$sqrt('4', rounding)).to.be.bignumber.equal('2');
        expect(await this.math.$sqrt('144', rounding)).to.be.bignumber.equal('12');
        expect(await this.math.$sqrt('999999', rounding)).to.be.bignumber.equal('1000');
        expect(await this.math.$sqrt('1000000', rounding)).to.be.bignumber.equal('1000');
        expect(await this.math.$sqrt('1000001', rounding)).to.be.bignumber.equal('1001');
        expect(await this.math.$sqrt('1002000', rounding)).to.be.bignumber.equal('1001');
        expect(await this.math.$sqrt('1002001', rounding)).to.be.bignumber.equal('1001');
        expect(await this.math.$sqrt(MAX_UINT256, rounding)).to.be.bignumber.equal(
          '340282366920938463463374607431768211456',
        );
      }
    });
  });

  describe('log', function () {
    describe('log2', function () {
      it('rounds down', async function () {
        for (const rounding of RoundingDown) {
          expect(await this.math.methods['$log2(uint256,uint8)']('0', rounding)).to.be.bignumber.equal('0');
          expect(await this.math.methods['$log2(uint256,uint8)']('1', rounding)).to.be.bignumber.equal('0');
          expect(await this.math.methods['$log2(uint256,uint8)']('2', rounding)).to.be.bignumber.equal('1');
          expect(await this.math.methods['$log2(uint256,uint8)']('3', rounding)).to.be.bignumber.equal('1');
          expect(await this.math.methods['$log2(uint256,uint8)']('4', rounding)).to.be.bignumber.equal('2');
          expect(await this.math.methods['$log2(uint256,uint8)']('5', rounding)).to.be.bignumber.equal('2');
          expect(await this.math.methods['$log2(uint256,uint8)']('6', rounding)).to.be.bignumber.equal('2');
          expect(await this.math.methods['$log2(uint256,uint8)']('7', rounding)).to.be.bignumber.equal('2');
          expect(await this.math.methods['$log2(uint256,uint8)']('8', rounding)).to.be.bignumber.equal('3');
          expect(await this.math.methods['$log2(uint256,uint8)']('9', rounding)).to.be.bignumber.equal('3');
          expect(await this.math.methods['$log2(uint256,uint8)'](MAX_UINT256, rounding)).to.be.bignumber.equal('255');
        }
      });

      it('rounds up', async function () {
        for (const rounding of RoundingUp) {
          expect(await this.math.methods['$log2(uint256,uint8)']('0', rounding)).to.be.bignumber.equal('0');
          expect(await this.math.methods['$log2(uint256,uint8)']('1', rounding)).to.be.bignumber.equal('0');
          expect(await this.math.methods['$log2(uint256,uint8)']('2', rounding)).to.be.bignumber.equal('1');
          expect(await this.math.methods['$log2(uint256,uint8)']('3', rounding)).to.be.bignumber.equal('2');
          expect(await this.math.methods['$log2(uint256,uint8)']('4', rounding)).to.be.bignumber.equal('2');
          expect(await this.math.methods['$log2(uint256,uint8)']('5', rounding)).to.be.bignumber.equal('3');
          expect(await this.math.methods['$log2(uint256,uint8)']('6', rounding)).to.be.bignumber.equal('3');
          expect(await this.math.methods['$log2(uint256,uint8)']('7', rounding)).to.be.bignumber.equal('3');
          expect(await this.math.methods['$log2(uint256,uint8)']('8', rounding)).to.be.bignumber.equal('3');
          expect(await this.math.methods['$log2(uint256,uint8)']('9', rounding)).to.be.bignumber.equal('4');
          expect(await this.math.methods['$log2(uint256,uint8)'](MAX_UINT256, rounding)).to.be.bignumber.equal('256');
        }
      });
    });

    describe('log10', function () {
      it('rounds down', async function () {
        for (const rounding of RoundingDown) {
          expect(await this.math.$log10('0', rounding)).to.be.bignumber.equal('0');
          expect(await this.math.$log10('1', rounding)).to.be.bignumber.equal('0');
          expect(await this.math.$log10('2', rounding)).to.be.bignumber.equal('0');
          expect(await this.math.$log10('9', rounding)).to.be.bignumber.equal('0');
          expect(await this.math.$log10('10', rounding)).to.be.bignumber.equal('1');
          expect(await this.math.$log10('11', rounding)).to.be.bignumber.equal('1');
          expect(await this.math.$log10('99', rounding)).to.be.bignumber.equal('1');
          expect(await this.math.$log10('100', rounding)).to.be.bignumber.equal('2');
          expect(await this.math.$log10('101', rounding)).to.be.bignumber.equal('2');
          expect(await this.math.$log10('999', rounding)).to.be.bignumber.equal('2');
          expect(await this.math.$log10('1000', rounding)).to.be.bignumber.equal('3');
          expect(await this.math.$log10('1001', rounding)).to.be.bignumber.equal('3');
          expect(await this.math.$log10(MAX_UINT256, rounding)).to.be.bignumber.equal('77');
        }
      });

      it('rounds up', async function () {
        for (const rounding of RoundingUp) {
          expect(await this.math.$log10('0', rounding)).to.be.bignumber.equal('0');
          expect(await this.math.$log10('1', rounding)).to.be.bignumber.equal('0');
          expect(await this.math.$log10('2', rounding)).to.be.bignumber.equal('1');
          expect(await this.math.$log10('9', rounding)).to.be.bignumber.equal('1');
          expect(await this.math.$log10('10', rounding)).to.be.bignumber.equal('1');
          expect(await this.math.$log10('11', rounding)).to.be.bignumber.equal('2');
          expect(await this.math.$log10('99', rounding)).to.be.bignumber.equal('2');
          expect(await this.math.$log10('100', rounding)).to.be.bignumber.equal('2');
          expect(await this.math.$log10('101', rounding)).to.be.bignumber.equal('3');
          expect(await this.math.$log10('999', rounding)).to.be.bignumber.equal('3');
          expect(await this.math.$log10('1000', rounding)).to.be.bignumber.equal('3');
          expect(await this.math.$log10('1001', rounding)).to.be.bignumber.equal('4');
          expect(await this.math.$log10(MAX_UINT256, rounding)).to.be.bignumber.equal('78');
        }
      });
    });

    describe('log256', function () {
      it('rounds down', async function () {
        for (const rounding of RoundingDown) {
          expect(await this.math.$log256('0', rounding)).to.be.bignumber.equal('0');
          expect(await this.math.$log256('1', rounding)).to.be.bignumber.equal('0');
          expect(await this.math.$log256('2', rounding)).to.be.bignumber.equal('0');
          expect(await this.math.$log256('255', rounding)).to.be.bignumber.equal('0');
          expect(await this.math.$log256('256', rounding)).to.be.bignumber.equal('1');
          expect(await this.math.$log256('257', rounding)).to.be.bignumber.equal('1');
          expect(await this.math.$log256('65535', rounding)).to.be.bignumber.equal('1');
          expect(await this.math.$log256('65536', rounding)).to.be.bignumber.equal('2');
          expect(await this.math.$log256('65537', rounding)).to.be.bignumber.equal('2');
          expect(await this.math.$log256(MAX_UINT256, rounding)).to.be.bignumber.equal('31');
        }
      });

      it('rounds up', async function () {
        for (const rounding of RoundingUp) {
          expect(await this.math.$log256('0', rounding)).to.be.bignumber.equal('0');
          expect(await this.math.$log256('1', rounding)).to.be.bignumber.equal('0');
          expect(await this.math.$log256('2', rounding)).to.be.bignumber.equal('1');
          expect(await this.math.$log256('255', rounding)).to.be.bignumber.equal('1');
          expect(await this.math.$log256('256', rounding)).to.be.bignumber.equal('1');
          expect(await this.math.$log256('257', rounding)).to.be.bignumber.equal('2');
          expect(await this.math.$log256('65535', rounding)).to.be.bignumber.equal('2');
          expect(await this.math.$log256('65536', rounding)).to.be.bignumber.equal('2');
          expect(await this.math.$log256('65537', rounding)).to.be.bignumber.equal('3');
          expect(await this.math.$log256(MAX_UINT256, rounding)).to.be.bignumber.equal('32');
        }
      });
    });
  });
});
