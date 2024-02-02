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
    Generic: 0x0,
    Assert: PANIC_CODES.ASSERTION_ERROR,
    UnderOverflow: PANIC_CODES.ARITHMETIC_UNDER_OR_OVERFLOW,
    DivisionByZero: PANIC_CODES.DIVISION_BY_ZERO,
    EnumConversionError: PANIC_CODES.ENUM_CONVERSION_OUT_OF_BOUNDS,
    StorageEncodingError: PANIC_CODES.INCORRECTLY_ENCODED_STORAGE_BYTE_ARRAY,
    EmptyArrayPop: PANIC_CODES.POP_ON_EMPTY_ARRAY,
    ArrayOutOfBounds: PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS,
    ResourceError: PANIC_CODES.TOO_MUCH_MEMORY_ALLOCATED,
    InvalidInternalFunction: PANIC_CODES.ZERO_INITIALIZED_VARIABLE,
  })) {
    describe(name, function () {
      it('exposes panic code as constant', async function () {
        expect(await this.mock.getFunction(`$${name}`)()).to.equal(code);
      });

      it(`throw panic code ${ethers.toBeHex(code)}`, async function () {
        await expect(this.mock.$panic(code)).to.be.revertedWithPanic(code);
      });
    });
  }
});
