const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');

async function fixture() {
  return { mock: await ethers.deployContract('$Panic') };
}

describe('Panic', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  for (const [name, code] of Object.entries({
    GENERIC: 0x0,
    ASSERT: PANIC_CODES.ASSERTION_ERROR,
    UNDER_OVERFLOW: PANIC_CODES.ARITHMETIC_UNDER_OR_OVERFLOW,
    DIVISION_BY_ZERO: PANIC_CODES.DIVISION_BY_ZERO,
    ENUM_CONVERSION_ERROR: PANIC_CODES.ENUM_CONVERSION_OUT_OF_BOUNDS,
    STORAGE_ENCODING_ERROR: PANIC_CODES.INCORRECTLY_ENCODED_STORAGE_BYTE_ARRAY,
    EMPTY_ARRAY_POP: PANIC_CODES.POP_ON_EMPTY_ARRAY,
    ARRAY_OUT_OF_BOUNDS: PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS,
    RESOURCE_ERROR: PANIC_CODES.TOO_MUCH_MEMORY_ALLOCATED,
    INVALID_INTERNAL_FUNCTION: PANIC_CODES.ZERO_INITIALIZED_VARIABLE,
  })) {
    describe(`${name} (${ethers.toBeHex(code)})`, function () {
      it('exposes panic code as constant', async function () {
        expect(await this.mock.getFunction(`$${name}`)()).to.equal(code);
      });

      it('reverts with panic when called', async function () {
        await expect(this.mock.$panic(code)).to.be.revertedWithPanic(code);
      });
    });
  }
});
