const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { range } = require('../../helpers/iterate');

async function fixture() {
  const mock = await ethers.deployContract('$SafeCast');
  return { mock };
}

describe('SafeCast', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  for (const bits of range(8, 256, 8).map(ethers.toBigInt)) {
    const maxValue = 2n ** bits - 1n;

    describe(`toUint${bits}`, () => {
      it('downcasts 0', async function () {
        expect(await this.mock[`$toUint${bits}`](0n)).is.equal(0n);
      });

      it('downcasts 1', async function () {
        expect(await this.mock[`$toUint${bits}`](1n)).is.equal(1n);
      });

      it(`downcasts 2^${bits} - 1 (${maxValue})`, async function () {
        expect(await this.mock[`$toUint${bits}`](maxValue)).is.equal(maxValue);
      });

      it(`reverts when downcasting 2^${bits} (${maxValue + 1n})`, async function () {
        await expect(this.mock[`$toUint${bits}`](maxValue + 1n))
          .to.be.revertedWithCustomError(this.mock, 'SafeCastOverflowedUintDowncast')
          .withArgs(bits, maxValue + 1n);
      });

      it(`reverts when downcasting 2^${bits} + 1 (${maxValue + 2n})`, async function () {
        await expect(this.mock[`$toUint${bits}`](maxValue + 2n))
          .to.be.revertedWithCustomError(this.mock, 'SafeCastOverflowedUintDowncast')
          .withArgs(bits, maxValue + 2n);
      });
    });
  }

  describe('toUint256', () => {
    it('casts 0', async function () {
      expect(await this.mock.$toUint256(0n)).is.equal(0n);
    });

    it('casts 1', async function () {
      expect(await this.mock.$toUint256(1n)).is.equal(1n);
    });

    it(`casts INT256_MAX (${ethers.MaxInt256})`, async function () {
      expect(await this.mock.$toUint256(ethers.MaxInt256)).is.equal(ethers.MaxInt256);
    });

    it('reverts when casting -1', async function () {
      await expect(this.mock.$toUint256(-1n))
        .to.be.revertedWithCustomError(this.mock, 'SafeCastOverflowedIntToUint')
        .withArgs(-1n);
    });

    it(`reverts when casting INT256_MIN (${ethers.MinInt256})`, async function () {
      await expect(this.mock.$toUint256(ethers.MinInt256))
        .to.be.revertedWithCustomError(this.mock, 'SafeCastOverflowedIntToUint')
        .withArgs(ethers.MinInt256);
    });
  });

  for (const bits of range(8, 256, 8).map(ethers.toBigInt)) {
    const minValue = -(2n ** (bits - 1n));
    const maxValue = 2n ** (bits - 1n) - 1n;

    describe(`toInt${bits}`, () => {
      it('downcasts 0', async function () {
        expect(await this.mock[`$toInt${bits}`](0n)).is.equal(0n);
      });

      it('downcasts 1', async function () {
        expect(await this.mock[`$toInt${bits}`](1n)).is.equal(1n);
      });

      it('downcasts -1', async function () {
        expect(await this.mock[`$toInt${bits}`](-1n)).is.equal(-1n);
      });

      it(`downcasts -2^${bits - 1n} (${minValue})`, async function () {
        expect(await this.mock[`$toInt${bits}`](minValue)).is.equal(minValue);
      });

      it(`downcasts 2^${bits - 1n} - 1 (${maxValue})`, async function () {
        expect(await this.mock[`$toInt${bits}`](maxValue)).is.equal(maxValue);
      });

      it(`reverts when downcasting -2^${bits - 1n} - 1 (${minValue - 1n})`, async function () {
        await expect(this.mock[`$toInt${bits}`](minValue - 1n))
          .to.be.revertedWithCustomError(this.mock, 'SafeCastOverflowedIntDowncast')
          .withArgs(bits, minValue - 1n);
      });

      it(`reverts when downcasting -2^${bits - 1n} - 2 (${minValue - 2n})`, async function () {
        await expect(this.mock[`$toInt${bits}`](minValue - 2n))
          .to.be.revertedWithCustomError(this.mock, 'SafeCastOverflowedIntDowncast')
          .withArgs(bits, minValue - 2n);
      });

      it(`reverts when downcasting 2^${bits - 1n} (${maxValue + 1n})`, async function () {
        await expect(this.mock[`$toInt${bits}`](maxValue + 1n))
          .to.be.revertedWithCustomError(this.mock, 'SafeCastOverflowedIntDowncast')
          .withArgs(bits, maxValue + 1n);
      });

      it(`reverts when downcasting 2^${bits - 1n} + 1 (${maxValue + 2n})`, async function () {
        await expect(this.mock[`$toInt${bits}`](maxValue + 2n))
          .to.be.revertedWithCustomError(this.mock, 'SafeCastOverflowedIntDowncast')
          .withArgs(bits, maxValue + 2n);
      });
    });
  }

  describe('toInt256', () => {
    it('casts 0', async function () {
      expect(await this.mock.$toInt256(0)).is.equal(0n);
    });

    it('casts 1', async function () {
      expect(await this.mock.$toInt256(1)).is.equal(1n);
    });

    it(`casts INT256_MAX (${ethers.MaxInt256})`, async function () {
      expect(await this.mock.$toInt256(ethers.MaxInt256)).is.equal(ethers.MaxInt256);
    });

    it(`reverts when casting INT256_MAX + 1 (${ethers.MaxInt256 + 1n})`, async function () {
      await expect(this.mock.$toInt256(ethers.MaxInt256 + 1n))
        .to.be.revertedWithCustomError(this.mock, 'SafeCastOverflowedUintToInt')
        .withArgs(ethers.MaxInt256 + 1n);
    });

    it(`reverts when casting UINT256_MAX (${ethers.MaxUint256})`, async function () {
      await expect(this.mock.$toInt256(ethers.MaxUint256))
        .to.be.revertedWithCustomError(this.mock, 'SafeCastOverflowedUintToInt')
        .withArgs(ethers.MaxUint256);
    });
  });

  describe('toUint (bool)', function () {
    it('toUint(false) should be 0', async function () {
      expect(await this.mock.$toUint(false)).to.equal(0n);
    });

    it('toUint(true) should be 1', async function () {
      expect(await this.mock.$toUint(true)).to.equal(1n);
    });
  });
});
