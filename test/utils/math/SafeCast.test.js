const { BN, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { range } = require('../../../scripts/helpers');

const SafeCastMock = artifacts.require('SafeCastMock');

contract('SafeCast', async (accounts) => {
  beforeEach(async function () {
    this.safeCast = await SafeCastMock.new();
  });

  function testToUint (bits) {
    describe(`toUint${bits}`, () => {
      const maxValue = new BN('2').pow(new BN(bits)).subn(1);

      it('downcasts 0', async function () {
        expect(await this.safeCast[`toUint${bits}`](0)).to.be.bignumber.equal('0');
      });

      it('downcasts 1', async function () {
        expect(await this.safeCast[`toUint${bits}`](1)).to.be.bignumber.equal('1');
      });

      it(`downcasts 2^${bits} - 1 (${maxValue})`, async function () {
        expect(await this.safeCast[`toUint${bits}`](maxValue)).to.be.bignumber.equal(maxValue);
      });

      it(`reverts when downcasting 2^${bits} (${maxValue.addn(1)})`, async function () {
        await expectRevert(
          this.safeCast[`toUint${bits}`](maxValue.addn(1)),
          `SafeCast: value doesn't fit in ${bits} bits`,
        );
      });

      it(`reverts when downcasting 2^${bits} + 1 (${maxValue.addn(2)})`, async function () {
        await expectRevert(
          this.safeCast[`toUint${bits}`](maxValue.addn(2)),
          `SafeCast: value doesn't fit in ${bits} bits`,
        );
      });
    });
  }

  range(8, 256, 8).forEach(bits => testToUint(bits));

  describe('toUint256', () => {
    const maxInt256 = new BN('2').pow(new BN(255)).subn(1);
    const minInt256 = new BN('2').pow(new BN(255)).neg();

    it('casts 0', async function () {
      expect(await this.safeCast.toUint256(0)).to.be.bignumber.equal('0');
    });

    it('casts 1', async function () {
      expect(await this.safeCast.toUint256(1)).to.be.bignumber.equal('1');
    });

    it(`casts INT256_MAX (${maxInt256})`, async function () {
      expect(await this.safeCast.toUint256(maxInt256)).to.be.bignumber.equal(maxInt256);
    });

    it('reverts when casting -1', async function () {
      await expectRevert(
        this.safeCast.toUint256(-1),
        'SafeCast: value must be positive',
      );
    });

    it(`reverts when casting INT256_MIN (${minInt256})`, async function () {
      await expectRevert(
        this.safeCast.toUint256(minInt256),
        'SafeCast: value must be positive',
      );
    });
  });

  function testToInt (bits) {
    describe(`toInt${bits}`, () => {
      const minValue = new BN('-2').pow(new BN(bits - 1));
      const maxValue = new BN('2').pow(new BN(bits - 1)).subn(1);

      it('downcasts 0', async function () {
        expect(await this.safeCast[`toInt${bits}`](0)).to.be.bignumber.equal('0');
      });

      it('downcasts 1', async function () {
        expect(await this.safeCast[`toInt${bits}`](1)).to.be.bignumber.equal('1');
      });

      it('downcasts -1', async function () {
        expect(await this.safeCast[`toInt${bits}`](-1)).to.be.bignumber.equal('-1');
      });

      it(`downcasts -2^${bits - 1} (${minValue})`, async function () {
        expect(await this.safeCast[`toInt${bits}`](minValue)).to.be.bignumber.equal(minValue);
      });

      it(`downcasts 2^${bits - 1} - 1 (${maxValue})`, async function () {
        expect(await this.safeCast[`toInt${bits}`](maxValue)).to.be.bignumber.equal(maxValue);
      });

      it(`reverts when downcasting -2^${bits - 1} - 1 (${minValue.subn(1)})`, async function () {
        await expectRevert(
          this.safeCast[`toInt${bits}`](minValue.subn(1)),
          `SafeCast: value doesn't fit in ${bits} bits`,
        );
      });

      it(`reverts when downcasting -2^${bits - 1} - 2 (${minValue.subn(2)})`, async function () {
        await expectRevert(
          this.safeCast[`toInt${bits}`](minValue.subn(2)),
          `SafeCast: value doesn't fit in ${bits} bits`,
        );
      });

      it(`reverts when downcasting 2^${bits - 1} (${maxValue.addn(1)})`, async function () {
        await expectRevert(
          this.safeCast[`toInt${bits}`](maxValue.addn(1)),
          `SafeCast: value doesn't fit in ${bits} bits`,
        );
      });

      it(`reverts when downcasting 2^${bits - 1} + 1 (${maxValue.addn(2)})`, async function () {
        await expectRevert(
          this.safeCast[`toInt${bits}`](maxValue.addn(2)),
          `SafeCast: value doesn't fit in ${bits} bits`,
        );
      });
    });
  }

  range(8, 256, 8).forEach(bits => testToInt(bits));

  describe('toInt256', () => {
    const maxUint256 = new BN('2').pow(new BN(256)).subn(1);
    const maxInt256 = new BN('2').pow(new BN(255)).subn(1);

    it('casts 0', async function () {
      expect(await this.safeCast.toInt256(0)).to.be.bignumber.equal('0');
    });

    it('casts 1', async function () {
      expect(await this.safeCast.toInt256(1)).to.be.bignumber.equal('1');
    });

    it(`casts INT256_MAX (${maxInt256})`, async function () {
      expect(await this.safeCast.toInt256(maxInt256)).to.be.bignumber.equal(maxInt256);
    });

    it(`reverts when casting INT256_MAX + 1 (${maxInt256.addn(1)})`, async function () {
      await expectRevert(
        this.safeCast.toInt256(maxInt256.addn(1)),
        'SafeCast: value doesn\'t fit in an int256',
      );
    });

    it(`reverts when casting UINT256_MAX (${maxUint256})`, async function () {
      await expectRevert(
        this.safeCast.toInt256(maxUint256),
        'SafeCast: value doesn\'t fit in an int256',
      );
    });
  });
});
