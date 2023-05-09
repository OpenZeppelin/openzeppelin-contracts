const { BN, constants, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { MAX_UINT256 } = constants;
const { Rounding } = require('../../helpers/enums.js');

const Math = artifacts.require('$Math');

contract('Math', function () {
  const min = new BN('1234');
  const max = new BN('5678');
  const MAX_UINT256_SUB1 = MAX_UINT256.sub(new BN('1'));
  const MAX_UINT256_SUB2 = MAX_UINT256.sub(new BN('2'));

  beforeEach(async function () {
    this.math = await Math.new();
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
      await expectRevert.unspecified(this.math.$mulDiv(1, 1, 0, Rounding.Down));
    });

    describe('does round down', async function () {
      it('small values', async function () {
        expect(await this.math.$mulDiv('3', '4', '5', Rounding.Down)).to.be.bignumber.equal('2');
        expect(await this.math.$mulDiv('3', '5', '5', Rounding.Down)).to.be.bignumber.equal('3');
      });

      it('large values', async function () {
        expect(
          await this.math.$mulDiv(new BN('42'), MAX_UINT256_SUB1, MAX_UINT256, Rounding.Down),
        ).to.be.bignumber.equal(new BN('41'));

        expect(await this.math.$mulDiv(new BN('17'), MAX_UINT256, MAX_UINT256, Rounding.Down)).to.be.bignumber.equal(
          new BN('17'),
        );

        expect(
          await this.math.$mulDiv(MAX_UINT256_SUB1, MAX_UINT256_SUB1, MAX_UINT256, Rounding.Down),
        ).to.be.bignumber.equal(MAX_UINT256_SUB2);

        expect(
          await this.math.$mulDiv(MAX_UINT256, MAX_UINT256_SUB1, MAX_UINT256, Rounding.Down),
        ).to.be.bignumber.equal(MAX_UINT256_SUB1);

        expect(await this.math.$mulDiv(MAX_UINT256, MAX_UINT256, MAX_UINT256, Rounding.Down)).to.be.bignumber.equal(
          MAX_UINT256,
        );
      });
    });

    describe('does round up', async function () {
      it('small values', async function () {
        expect(await this.math.$mulDiv('3', '4', '5', Rounding.Up)).to.be.bignumber.equal('3');
        expect(await this.math.$mulDiv('3', '5', '5', Rounding.Up)).to.be.bignumber.equal('3');
      });

      it('large values', async function () {
        expect(await this.math.$mulDiv(new BN('42'), MAX_UINT256_SUB1, MAX_UINT256, Rounding.Up)).to.be.bignumber.equal(
          new BN('42'),
        );

        expect(await this.math.$mulDiv(new BN('17'), MAX_UINT256, MAX_UINT256, Rounding.Up)).to.be.bignumber.equal(
          new BN('17'),
        );

        expect(
          await this.math.$mulDiv(MAX_UINT256_SUB1, MAX_UINT256_SUB1, MAX_UINT256, Rounding.Up),
        ).to.be.bignumber.equal(MAX_UINT256_SUB1);

        expect(await this.math.$mulDiv(MAX_UINT256, MAX_UINT256_SUB1, MAX_UINT256, Rounding.Up)).to.be.bignumber.equal(
          MAX_UINT256_SUB1,
        );

        expect(await this.math.$mulDiv(MAX_UINT256, MAX_UINT256, MAX_UINT256, Rounding.Up)).to.be.bignumber.equal(
          MAX_UINT256,
        );
      });
    });
  });

  describe('sqrt', function () {
    it('rounds down', async function () {
      expect(await this.math.$sqrt('0', Rounding.Down)).to.be.bignumber.equal('0');
      expect(await this.math.$sqrt('1', Rounding.Down)).to.be.bignumber.equal('1');
      expect(await this.math.$sqrt('2', Rounding.Down)).to.be.bignumber.equal('1');
      expect(await this.math.$sqrt('3', Rounding.Down)).to.be.bignumber.equal('1');
      expect(await this.math.$sqrt('4', Rounding.Down)).to.be.bignumber.equal('2');
      expect(await this.math.$sqrt('144', Rounding.Down)).to.be.bignumber.equal('12');
      expect(await this.math.$sqrt('999999', Rounding.Down)).to.be.bignumber.equal('999');
      expect(await this.math.$sqrt('1000000', Rounding.Down)).to.be.bignumber.equal('1000');
      expect(await this.math.$sqrt('1000001', Rounding.Down)).to.be.bignumber.equal('1000');
      expect(await this.math.$sqrt('1002000', Rounding.Down)).to.be.bignumber.equal('1000');
      expect(await this.math.$sqrt('1002001', Rounding.Down)).to.be.bignumber.equal('1001');
      expect(await this.math.$sqrt(MAX_UINT256, Rounding.Down)).to.be.bignumber.equal(
        '340282366920938463463374607431768211455',
      );
    });

    it('rounds up', async function () {
      expect(await this.math.$sqrt('0', Rounding.Up)).to.be.bignumber.equal('0');
      expect(await this.math.$sqrt('1', Rounding.Up)).to.be.bignumber.equal('1');
      expect(await this.math.$sqrt('2', Rounding.Up)).to.be.bignumber.equal('2');
      expect(await this.math.$sqrt('3', Rounding.Up)).to.be.bignumber.equal('2');
      expect(await this.math.$sqrt('4', Rounding.Up)).to.be.bignumber.equal('2');
      expect(await this.math.$sqrt('144', Rounding.Up)).to.be.bignumber.equal('12');
      expect(await this.math.$sqrt('999999', Rounding.Up)).to.be.bignumber.equal('1000');
      expect(await this.math.$sqrt('1000000', Rounding.Up)).to.be.bignumber.equal('1000');
      expect(await this.math.$sqrt('1000001', Rounding.Up)).to.be.bignumber.equal('1001');
      expect(await this.math.$sqrt('1002000', Rounding.Up)).to.be.bignumber.equal('1001');
      expect(await this.math.$sqrt('1002001', Rounding.Up)).to.be.bignumber.equal('1001');
      expect(await this.math.$sqrt(MAX_UINT256, Rounding.Up)).to.be.bignumber.equal(
        '340282366920938463463374607431768211456',
      );
    });
  });

  describe('log', function () {
    describe('log2', function () {
      it('rounds down', async function () {
        // For some reason calling .$log2() directly fails
        expect(await this.math.methods['$log2(uint256,uint8)']('0', Rounding.Down)).to.be.bignumber.equal('0');
        expect(await this.math.methods['$log2(uint256,uint8)']('1', Rounding.Down)).to.be.bignumber.equal('0');
        expect(await this.math.methods['$log2(uint256,uint8)']('2', Rounding.Down)).to.be.bignumber.equal('1');
        expect(await this.math.methods['$log2(uint256,uint8)']('3', Rounding.Down)).to.be.bignumber.equal('1');
        expect(await this.math.methods['$log2(uint256,uint8)']('4', Rounding.Down)).to.be.bignumber.equal('2');
        expect(await this.math.methods['$log2(uint256,uint8)']('5', Rounding.Down)).to.be.bignumber.equal('2');
        expect(await this.math.methods['$log2(uint256,uint8)']('6', Rounding.Down)).to.be.bignumber.equal('2');
        expect(await this.math.methods['$log2(uint256,uint8)']('7', Rounding.Down)).to.be.bignumber.equal('2');
        expect(await this.math.methods['$log2(uint256,uint8)']('8', Rounding.Down)).to.be.bignumber.equal('3');
        expect(await this.math.methods['$log2(uint256,uint8)']('9', Rounding.Down)).to.be.bignumber.equal('3');
        expect(await this.math.methods['$log2(uint256,uint8)'](MAX_UINT256, Rounding.Down)).to.be.bignumber.equal(
          '255',
        );
      });

      it('rounds up', async function () {
        // For some reason calling .$log2() directly fails
        expect(await this.math.methods['$log2(uint256,uint8)']('0', Rounding.Up)).to.be.bignumber.equal('0');
        expect(await this.math.methods['$log2(uint256,uint8)']('1', Rounding.Up)).to.be.bignumber.equal('0');
        expect(await this.math.methods['$log2(uint256,uint8)']('2', Rounding.Up)).to.be.bignumber.equal('1');
        expect(await this.math.methods['$log2(uint256,uint8)']('3', Rounding.Up)).to.be.bignumber.equal('2');
        expect(await this.math.methods['$log2(uint256,uint8)']('4', Rounding.Up)).to.be.bignumber.equal('2');
        expect(await this.math.methods['$log2(uint256,uint8)']('5', Rounding.Up)).to.be.bignumber.equal('3');
        expect(await this.math.methods['$log2(uint256,uint8)']('6', Rounding.Up)).to.be.bignumber.equal('3');
        expect(await this.math.methods['$log2(uint256,uint8)']('7', Rounding.Up)).to.be.bignumber.equal('3');
        expect(await this.math.methods['$log2(uint256,uint8)']('8', Rounding.Up)).to.be.bignumber.equal('3');
        expect(await this.math.methods['$log2(uint256,uint8)']('9', Rounding.Up)).to.be.bignumber.equal('4');
        expect(await this.math.methods['$log2(uint256,uint8)'](MAX_UINT256, Rounding.Up)).to.be.bignumber.equal('256');
      });
    });

    describe('log10', function () {
      it('rounds down', async function () {
        expect(await this.math.$log10('0', Rounding.Down)).to.be.bignumber.equal('0');
        expect(await this.math.$log10('1', Rounding.Down)).to.be.bignumber.equal('0');
        expect(await this.math.$log10('2', Rounding.Down)).to.be.bignumber.equal('0');
        expect(await this.math.$log10('9', Rounding.Down)).to.be.bignumber.equal('0');
        expect(await this.math.$log10('10', Rounding.Down)).to.be.bignumber.equal('1');
        expect(await this.math.$log10('11', Rounding.Down)).to.be.bignumber.equal('1');
        expect(await this.math.$log10('99', Rounding.Down)).to.be.bignumber.equal('1');
        expect(await this.math.$log10('100', Rounding.Down)).to.be.bignumber.equal('2');
        expect(await this.math.$log10('101', Rounding.Down)).to.be.bignumber.equal('2');
        expect(await this.math.$log10('999', Rounding.Down)).to.be.bignumber.equal('2');
        expect(await this.math.$log10('1000', Rounding.Down)).to.be.bignumber.equal('3');
        expect(await this.math.$log10('1001', Rounding.Down)).to.be.bignumber.equal('3');
        expect(await this.math.$log10(MAX_UINT256, Rounding.Down)).to.be.bignumber.equal('77');
      });

      it('rounds up', async function () {
        expect(await this.math.$log10('0', Rounding.Up)).to.be.bignumber.equal('0');
        expect(await this.math.$log10('1', Rounding.Up)).to.be.bignumber.equal('0');
        expect(await this.math.$log10('2', Rounding.Up)).to.be.bignumber.equal('1');
        expect(await this.math.$log10('9', Rounding.Up)).to.be.bignumber.equal('1');
        expect(await this.math.$log10('10', Rounding.Up)).to.be.bignumber.equal('1');
        expect(await this.math.$log10('11', Rounding.Up)).to.be.bignumber.equal('2');
        expect(await this.math.$log10('99', Rounding.Up)).to.be.bignumber.equal('2');
        expect(await this.math.$log10('100', Rounding.Up)).to.be.bignumber.equal('2');
        expect(await this.math.$log10('101', Rounding.Up)).to.be.bignumber.equal('3');
        expect(await this.math.$log10('999', Rounding.Up)).to.be.bignumber.equal('3');
        expect(await this.math.$log10('1000', Rounding.Up)).to.be.bignumber.equal('3');
        expect(await this.math.$log10('1001', Rounding.Up)).to.be.bignumber.equal('4');
        expect(await this.math.$log10(MAX_UINT256, Rounding.Up)).to.be.bignumber.equal('78');
      });
    });

    describe('log256', function () {
      it('rounds down', async function () {
        expect(await this.math.$log256('0', Rounding.Down)).to.be.bignumber.equal('0');
        expect(await this.math.$log256('1', Rounding.Down)).to.be.bignumber.equal('0');
        expect(await this.math.$log256('2', Rounding.Down)).to.be.bignumber.equal('0');
        expect(await this.math.$log256('255', Rounding.Down)).to.be.bignumber.equal('0');
        expect(await this.math.$log256('256', Rounding.Down)).to.be.bignumber.equal('1');
        expect(await this.math.$log256('257', Rounding.Down)).to.be.bignumber.equal('1');
        expect(await this.math.$log256('65535', Rounding.Down)).to.be.bignumber.equal('1');
        expect(await this.math.$log256('65536', Rounding.Down)).to.be.bignumber.equal('2');
        expect(await this.math.$log256('65537', Rounding.Down)).to.be.bignumber.equal('2');
        expect(await this.math.$log256(MAX_UINT256, Rounding.Down)).to.be.bignumber.equal('31');
      });

      it('rounds up', async function () {
        expect(await this.math.$log256('0', Rounding.Up)).to.be.bignumber.equal('0');
        expect(await this.math.$log256('1', Rounding.Up)).to.be.bignumber.equal('0');
        expect(await this.math.$log256('2', Rounding.Up)).to.be.bignumber.equal('1');
        expect(await this.math.$log256('255', Rounding.Up)).to.be.bignumber.equal('1');
        expect(await this.math.$log256('256', Rounding.Up)).to.be.bignumber.equal('1');
        expect(await this.math.$log256('257', Rounding.Up)).to.be.bignumber.equal('2');
        expect(await this.math.$log256('65535', Rounding.Up)).to.be.bignumber.equal('2');
        expect(await this.math.$log256('65536', Rounding.Up)).to.be.bignumber.equal('2');
        expect(await this.math.$log256('65537', Rounding.Up)).to.be.bignumber.equal('3');
        expect(await this.math.$log256(MAX_UINT256, Rounding.Up)).to.be.bignumber.equal('32');
      });
    });
  });
});
