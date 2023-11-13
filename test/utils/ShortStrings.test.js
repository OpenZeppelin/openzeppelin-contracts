const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

function length(sstr) {
  return parseInt(sstr.slice(64), 16);
}

function decode(sstr) {
  return ethers.toUtf8String(sstr).slice(0, length(sstr));
}

async function fixture() {
  const mock = await ethers.deployContract('$ShortStrings');
  return { mock };
}

describe('ShortStrings', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  for (const str of [0, 1, 16, 31, 32, 64, 1024].map(length => 'a'.repeat(length))) {
    describe(`with string length ${str.length}`, function () {
      it('encode / decode', async function () {
        if (str.length < 32) {
          const encoded = await this.mock.$toShortString(str);
          expect(decode(encoded)).to.be.equal(str);

          const length = await this.mock.$byteLength(encoded);
          expect(length).to.be.equal(str.length);

          const decoded = await this.mock.$toString(encoded);
          expect(decoded).to.be.equal(str);
        } else {
          await expect(this.mock.$toShortString(str))
            .to.be.revertedWithCustomError(this.mock, 'StringTooLong')
            .withArgs(str);
        }
      });

      it('set / get with fallback', async function () {
        const ret0 = await this.mock.$toShortStringWithFallback.staticCall(str, 0);
        const tx = await this.mock.$toShortStringWithFallback(str, 0);
        await expect(tx).to.emit(this.mock, 'return$toShortStringWithFallback').withArgs(ret0);

        const promise = this.mock.$toString(ret0);
        if (str.length < 32) {
          expect(await promise).to.be.equal(str);
        } else {
          await expect(promise).to.be.revertedWithCustomError(this.mock, 'InvalidShortString');
        }

        const length = await this.mock.$byteLengthWithFallback(ret0, 0);
        expect(length).to.be.equal(str.length);

        const recovered = await this.mock.$toStringWithFallback(ret0, 0);
        expect(recovered).to.be.equal(str);
      });
    });
  }
});
