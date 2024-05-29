const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { forceDeployCode } = require('../helpers/deploy');
const { product } = require('../helpers/iterate');
const { SIZES } = require('../../scripts/generate/templates/Packing.opts');

async function fixture() {
  return { mock: await forceDeployCode('$Packing') };
}

describe('Packing', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('pack and extract', function () {
    for (const [s1, s2] of product(SIZES, SIZES)) {
      if (!SIZES.includes(s1 + s2)) continue;

      const left = ethers.Typed[`bytes${s1}`](ethers.hexlify(ethers.randomBytes(s1)));
      const right = ethers.Typed[`bytes${s2}`](ethers.hexlify(ethers.randomBytes(s2)));
      const packed = ethers.Typed[`bytes${s1 + s2}`](ethers.concat([left.value, right.value]));

      it(`bytes${s1} + bytes${s2} <> bytes${s1 + s2}`, async function () {
        expect(await this.mock.getFunction(`$pack_${s1}_${s2}`)(left, right)).to.equal(packed.value);
        expect(await this.mock.getFunction(`$extract_${s1 + s2}_${s1}`)(packed, 0)).to.equal(left.value);
        expect(await this.mock.getFunction(`$extract_${s1 + s2}_${s2}`)(packed, s1)).to.equal(right.value);
      });

      it(`out of range extraction`, async function () {
        await expect(this.mock.getFunction(`$extract_${s1 + s2}_${s2}`)(packed, s1 + 1)).to.be.revertedWithCustomError(
          this.mock,
          'OutOfRangeAccess',
        );
      });
    }
  });
});
