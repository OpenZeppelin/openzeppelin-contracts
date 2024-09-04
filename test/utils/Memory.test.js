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
    it('sets memory pointer', async function () {
      const ptr = '0x00000000000000000000000000000000000000000000000000000000000000a0';
      expect(await this.mock.$setFreePointer(ptr)).to.not.be.reverted;
    });

    it('gets memory pointer', async function () {
      expect(await this.mock.$getFreePointer()).to.equal(
        // Default pointer
        '0x0000000000000000000000000000000000000000000000000000000000000080',
      );
    });

    it('asBytes32', async function () {
      const ptr = ethers.toBeHex('0x1234', 32);
      await this.mock.$setFreePointer(ptr);
      expect(await this.mock.$asBytes32(ptr)).to.equal(ptr);
    });

    it('asPointer', async function () {
      const ptr = ethers.toBeHex('0x1234', 32);
      await this.mock.$setFreePointer(ptr);
      expect(await this.mock.$asPointer(ptr)).to.equal(ptr);
    });
  });
});
