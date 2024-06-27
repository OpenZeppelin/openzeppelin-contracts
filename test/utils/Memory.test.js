const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const mock = await ethers.deployContract('MemoryMock');

  return { mock };
}

describe('Memory', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('free pointer', function () {
    it('returns the new memory pointer after it has been altered', async function () {
      const ptr = '0x00000000000000000000000000000000000000000000000000000000000000a0';
      await this.mock._setFreePointer(ptr);
      expect(await this.mock._getFreePointer()).to.eq(ptr);
    });
  });
});
