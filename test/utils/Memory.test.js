const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const mock = await ethers.deployContract('$Memory');

  return { mock };
}

describe('Memory', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('free pointer', function () {
    it('sets free memory pointer', async function () {
      const ptr = ethers.toBeHex(0xa0, 32);
      await expect(this.mock.$setFreePointer(ptr)).to.not.be.reverted;
    });

    it('gets free memory pointer', async function () {
      await expect(this.mock.$getFreePointer()).to.eventually.equal(
        ethers.toBeHex(0x80, 32), // Default pointer
      );
    });
  });

  it('extractWord extracts a word', async function () {
    const ptr = await this.mock.$getFreePointer();
    await expect(this.mock.$extractWord(ptr)).to.eventually.equal(ethers.toBeHex(0, 32));
  });

  it('extractByte extracts a byte', async function () {
    const ptr = await this.mock.$getFreePointer();
    await expect(this.mock.$extractByte(ptr, 0)).to.eventually.equal(ethers.toBeHex(0, 1));
  });

  it('contentPointer', async function () {
    const data = ethers.toUtf8Bytes('hello world');
    const result = await this.mock.$contentPointer(data);
    expect(result).to.equal(ethers.toBeHex(0xa0, 32)); // 0x80 is the default free pointer (length)
  });

  describe('addOffset', function () {
    it('addOffset', async function () {
      const basePtr = ethers.toBeHex(0x80, 32);
      const offset = 32;
      const expectedPtr = ethers.toBeHex(0xa0, 32);

      await expect(this.mock.$addOffset(basePtr, offset)).to.eventually.equal(expectedPtr);
    });

    it('addOffsetwraps around', async function () {
      const basePtr = ethers.toBeHex(0x80, 32);
      const offset = 256;
      const expectedPtr = ethers.toBeHex(0x180, 32);
      await expect(this.mock.$addOffset(basePtr, offset)).to.eventually.equal(expectedPtr);
    });
  });

  describe('pointer conversions', function () {
    it('asBytes32 / asPointer', async function () {
      const ptr = ethers.toBeHex('0x1234', 32);
      await expect(this.mock.$asBytes32(ptr)).to.eventually.equal(ptr);
      await expect(this.mock.$asPointer(ethers.Typed.bytes32(ptr))).to.eventually.equal(ptr);
    });

    it('asBytes / asPointer', async function () {
      const ptr = await this.mock.$asPointer(ethers.Typed.bytes(ethers.toUtf8Bytes('hello world')));
      expect(ptr).to.equal(ethers.toBeHex(0x80, 32)); // Default free pointer
      await expect(this.mock.$asBytes(ptr)).to.eventually.equal(ethers.toBeHex(0x20, 32));
    });

    it('asUint256', async function () {
      const value = 0x1234;
      const ptr = ethers.toBeHex(value, 32);
      await expect(this.mock.$asUint256(ptr)).to.eventually.equal(value);
    });
  });

  describe('memory operations', function () {
    it('copy', async function () {
      await expect(this.mock.$copy(ethers.toBeHex(0x80, 32), ethers.toBeHex(0xc0, 32), 32)).to.not.be.reverted;
    });

    it('copy with zero length', async function () {
      await expect(this.mock.$copy(ethers.toBeHex(0x80, 32), ethers.toBeHex(0xc0, 32), 0)).to.not.be.reverted;
    });
  });
});
