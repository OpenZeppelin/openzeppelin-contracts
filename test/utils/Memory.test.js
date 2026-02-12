const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');

const { generators } = require('../helpers/random');

const formatSlice = ({ length, ptr = 0xa0 }) =>
  ethers.toBeHex((ethers.toBigInt(length) << 128n) | ethers.toBigInt(ptr), 32);

async function fixture() {
  const mock = await ethers.deployContract('$Memory');
  return { mock };
}

describe('Memory', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('Pointer', function () {
    describe('free pointer', function () {
      it('sets free memory pointer', async function () {
        const ptr = ethers.toBeHex(0xa0, 32);
        await expect(this.mock.$setFreeMemoryPointer(ptr)).to.not.be.reverted;
      });

      it('gets free memory pointer', async function () {
        await expect(this.mock.$getFreeMemoryPointer()).to.eventually.equal(
          ethers.toBeHex(0x80, 32), // Default pointer
        );
      });
    });

    describe('pointer conversions', function () {
      it('asBytes32', async function () {
        const ptr = ethers.toBeHex('0x1234', 32);
        await expect(this.mock.$asBytes32(ptr)).to.eventually.equal(ptr);
      });

      it('asPointer', async function () {
        const ptr = ethers.toBeHex('0x1234', 32);
        await expect(this.mock.$asPointer(ptr)).to.eventually.equal(ptr);
      });
    });
  });

  describe('Slices', function () {
    it('asSlice', async function () {
      for (const length of [0, 20, 32, 256]) {
        const buffer = ethers.getBytes(generators.bytes(length));
        await expect(this.mock.$asSlice(buffer)).to.eventually.equal(formatSlice({ length }));
      }
    });

    it('length', async function () {
      for (const ptr of ['0x00', '0xa0', '0x42a0']) {
        for (const length of [0, 20, 32, 256]) {
          await expect(this.mock.$length(formatSlice({ length, ptr }))).to.eventually.equal(length);
        }
      }
    });

    it('slice(Slice,uint256)', async function () {
      await expect(
        this.mock.getFunction('$slice(bytes32,uint256)')(formatSlice({ length: 0n, ptr: 256n }), 0n),
      ).to.eventually.equal(formatSlice({ length: 0n, ptr: 256n }));
      await expect(
        this.mock.getFunction('$slice(bytes32,uint256)')(formatSlice({ length: 10n, ptr: 256n }), 0n),
      ).to.eventually.equal(formatSlice({ length: 10n, ptr: 256n }));
      await expect(
        this.mock.getFunction('$slice(bytes32,uint256)')(formatSlice({ length: 10n, ptr: 256n }), 8n),
      ).to.eventually.equal(formatSlice({ length: 2n, ptr: 264n }));
      await expect(
        this.mock.getFunction('$slice(bytes32,uint256)')(formatSlice({ length: 10n, ptr: 256n }), 10n),
      ).to.eventually.equal(formatSlice({ length: 0n, ptr: 266n }));
      await expect(
        this.mock.getFunction('$slice(bytes32,uint256)')(formatSlice({ length: 0n, ptr: 256n }), 1n),
      ).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
      await expect(
        this.mock.getFunction('$slice(bytes32,uint256)')(formatSlice({ length: 10n, ptr: 256n }), 11n),
      ).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
    });

    it('slice(Slice,uint256,uint256)', async function () {
      await expect(
        this.mock.getFunction('$slice(bytes32,uint256,uint256)')(formatSlice({ length: 0n, ptr: 256n }), 0n, 0n),
      ).to.eventually.equal(formatSlice({ length: 0n, ptr: 256n }));
      await expect(
        this.mock.getFunction('$slice(bytes32,uint256,uint256)')(formatSlice({ length: 10n, ptr: 256n }), 0n, 10n),
      ).to.eventually.equal(formatSlice({ length: 10n, ptr: 256n }));
      await expect(
        this.mock.getFunction('$slice(bytes32,uint256,uint256)')(formatSlice({ length: 10n, ptr: 256n }), 0n, 4n),
      ).to.eventually.equal(formatSlice({ length: 4n, ptr: 256n }));
      await expect(
        this.mock.getFunction('$slice(bytes32,uint256,uint256)')(formatSlice({ length: 10n, ptr: 256n }), 4n, 4n),
      ).to.eventually.equal(formatSlice({ length: 4n, ptr: 260n }));
      await expect(
        this.mock.getFunction('$slice(bytes32,uint256,uint256)')(formatSlice({ length: 0n, ptr: 256n }), 0n, 1n),
      ).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
      await expect(
        this.mock.getFunction('$slice(bytes32,uint256,uint256)')(formatSlice({ length: 10n, ptr: 256n }), 6n, 6n),
      ).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
    });
  });
});
