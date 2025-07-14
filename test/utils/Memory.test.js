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
