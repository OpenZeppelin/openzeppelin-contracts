const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const mock = await ethers.deployContract('$Base58');
  return { mock };
}

describe('Base58', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('base58', function () {
    describe('encode/decode', function () {
      for (const length of [0, 1, 2, 3, 4, 32, 42, 128, 384]) // 512 runs out of gas
        it(`buffer of length ${length}`, async function () {
          const buffer = ethers.randomBytes(length);
          const hex = ethers.hexlify(buffer);
          const b58 = ethers.encodeBase58(buffer);

          expect(await this.mock.$encode(hex)).to.equal(b58);
          expect(await this.mock.$decode(b58)).to.equal(hex);
        });
    });

    describe('decode invalid format', function () {
      for (const chr of ['I', '-', '~'])
        it(`Invalid base58 char ${chr}`, async function () {
          await expect(this.mock.$decode(`VYRWKp${chr}pnN7`))
            .to.be.revertedWithCustomError(this.mock, 'InvalidBase56Digit')
            .withArgs(chr.codePointAt(0));
        });
    });
  });
});
