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

  describe('free memory pointer', function () {
    it('sets free memory pointer', async function () {
      const ptr = '0x00000000000000000000000000000000000000000000000000000000000000a0';
      await expect(this.mock.$setFMP(ptr)).to.not.be.reverted;
    });

    it('gets free memory pointer', async function () {
      await expect(this.mock.$getFMP()).to.eventually.equal(
        // Default pointer
        '0x0000000000000000000000000000000000000000000000000000000000000080',
      );
    });

    it('asBytes32', async function () {
      const ptr = '0x0000000000000000000000000000000000000000000000000000000000001234';
      await expect(this.mock.$asBytes32(ptr)).to.eventually.equal(ptr);
    });

    it('asPointer', async function () {
      const ptr = '0x0000000000000000000000000000000000000000000000000000000000001234';
      await expect(this.mock.$asPointer(ptr)).to.eventually.equal(ptr);
    });
  });
});
