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

  for (const [name, code] of Object.entries(PANIC_CODES)) {
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
