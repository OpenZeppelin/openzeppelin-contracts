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

  describe('pack', function () {
    for (const [size1, size2] of product(SIZES, SIZES).filter(([size1, size2]) => SIZES.includes(size1 + size2))) {
      const value1 = ethers.hexlify(ethers.randomBytes(size1));
      const value2 = ethers.hexlify(ethers.randomBytes(size2));
      const packed = ethers.concat([value1, value2]);

      it(`pack bytes${size1} + bytes${size2} => bytes${size1 + size2}`, async function () {
        expect(await this.mock[`$pack_${size1}_${size2}`](value1, value2)).to.equal(packed);
        expect(await this.mock[`$extract_${size1 + size2}_${size1}`](packed, 0)).to.equal(value1);
        expect(await this.mock[`$extract_${size1 + size2}_${size2}`](packed, size1)).to.equal(value2);
      });
    }
  });

  describe('extract / replace', function () {
    for (const [size1, size2] of product(SIZES, SIZES).filter(([size1, size2]) => size1 > size2)) {
      const MAX_OFFSET = size1 - size2;
      const offset = ethers.toNumber(ethers.randomBytes(1)) % (MAX_OFFSET + 1);
      const outer = ethers.randomBytes(size1);
      const value = ethers.randomBytes(size2);

      it(`extract bytes${size2} from bytes${size1}`, async function () {
        expect(await this.mock[`$extract_${size1}_${size2}`](outer, offset)).to.equal(
          ethers.hexlify(outer.slice(offset, offset + size2)),
        );

        await expect(this.mock[`$extract_${size1}_${size2}`](outer, MAX_OFFSET)).to.not.be.revertedWithCustomError(
          this.mock,
          'OutOfRangeAccess',
        );

        await expect(this.mock[`$extract_${size1}_${size2}`](outer, MAX_OFFSET + 1)).to.be.revertedWithCustomError(
          this.mock,
          'OutOfRangeAccess',
        );
      });

      it(`replace bytes${size2} from bytes${size1}`, async function () {
        expect(await this.mock[`$replace_${size1}_${size2}`](outer, value, offset)).to.equal(
          ethers.concat([outer.slice(0, offset), value, outer.slice(offset + size2)]),
        );

        await expect(
          this.mock[`$replace_${size1}_${size2}`](outer, value, MAX_OFFSET),
        ).to.not.be.revertedWithCustomError(this.mock, 'OutOfRangeAccess');

        await expect(
          this.mock[`$replace_${size1}_${size2}`](outer, value, MAX_OFFSET + 1),
        ).to.be.revertedWithCustomError(this.mock, 'OutOfRangeAccess');
      });
    }
  });
});
