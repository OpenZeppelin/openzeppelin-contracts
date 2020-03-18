const { contract } = require('@openzeppelin/test-environment');
const { BN, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const SafeCastMock = contract.fromArtifact('SafeCastMock');

describe('SafeCast', async () => {
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
          `SafeCast: value doesn't fit in ${bits} bits`
        );
      });

      it(`reverts when downcasting 2^${bits} + 1 (${maxValue.addn(2)})`, async function () {
        await expectRevert(
          this.safeCast[`toUint${bits}`](maxValue.addn(2)),
          `SafeCast: value doesn't fit in ${bits} bits`
        );
      });
    });
  }

  [8, 16, 32, 64, 128].forEach(bits => testToUint(bits));

  describe('toUint256', () => {
    const maxInt256 = new BN('1').shln(255).notn(256);
    const minInt256 = new BN('1').shln(255);
    const maxUint256 = new BN('0').notn(256);

    it('casts 0', async function () {
      expect(await this.safeCast.toUint256(0)).to.be.bignumber.equal('0');
    });

    it('casts 1', async function () {
      expect(await this.safeCast.toUint256(1)).to.be.bignumber.equal('1');
    });

    it(`casts INT256_MAX ${maxInt256}`, async function () {
      expect(await this.safeCast.toUint256(maxInt256)).to.be.bignumber.equal(maxInt256);
    });

    it('reverts when casting -1', async function () {
      await expectRevert(
        this.safeCast.toUint256(-1),
        'SafeCast: value must be positive'
      );
    });

    it(`reverts when casting INT256_MIN ${minInt256}`, async function () {
      await expectRevert(
        this.safeCast.toUint256(minInt256),
        'SafeCast: value must be positive'
      );
    });

    it(`reverts when casting UINT256_MAX ${maxUint256}`, async function () {
      await expectRevert(
        this.safeCast.toUint256(maxUint256),
        'SafeCast: value must be positive'
      );
    });
  });

  describe('toInt256', () => {
    const maxUint256 = new BN('0').notn(256);
    const maxInt256 = new BN('1').shln(255).notn(256);

    it('casts 0', async function () {
      expect(await this.safeCast.toInt256(0)).to.be.bignumber.equal('0');
    });

    it('casts 1', async function () {
      expect(await this.safeCast.toInt256(1)).to.be.bignumber.equal('1');
    });

    it(`casts INT256_MAX ${maxInt256}`, async function () {
      expect(await this.safeCast.toInt256(maxInt256)).to.be.bignumber.equal(maxInt256);
    });

    it(`reverts when casting INT256_MAX + 1 ${maxInt256.addn(1)}`, async function () {
      await expectRevert(
        this.safeCast.toInt256(maxInt256.addn(1)),
        'SafeCast: value doesn\'t fit in 255 bits'
      );
    });

    it(`reverts when casting UINT256_MAX ${maxUint256}`, async function () {
      await expectRevert(
        this.safeCast.toInt256(maxUint256),
        'SafeCast: value doesn\'t fit in 255 bits'
      );
    });
  });
});
