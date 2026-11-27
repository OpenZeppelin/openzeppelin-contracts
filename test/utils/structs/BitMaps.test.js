import { network } from 'hardhat';
import { expect } from 'chai';
import { BITMAP_TYPES } from '../../../scripts/generate/data.js';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.create();

async function fixture() {
  return { bitmap: await ethers.deployContract('$BitMaps') };
}

describe('BitMaps', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('BitMap', function () {
    const keyA = 7891n;
    const keyB = 451n;
    const keyC = 9592328n;

    it('starts empty', async function () {
      await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA)).to.eventually.be.false;
      await expect(this.bitmap.$get_BitMaps_BitMap(0, keyB)).to.eventually.be.false;
      await expect(this.bitmap.$get_BitMaps_BitMap(0, keyC)).to.eventually.be.false;
    });

    describe('setTo', function () {
      it('set a key to true', async function () {
        await this.bitmap.$setTo(0, keyA, true);
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA)).to.eventually.be.true;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyB)).to.eventually.be.false;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyC)).to.eventually.be.false;
      });

      it('set a key to false', async function () {
        await this.bitmap.$setTo(0, keyA, true);
        await this.bitmap.$setTo(0, keyA, false);
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA)).to.eventually.be.false;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyB)).to.eventually.be.false;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyC)).to.eventually.be.false;
      });

      it('set several consecutive keys', async function () {
        await this.bitmap.$setTo(0, keyA + 0n, true);
        await this.bitmap.$setTo(0, keyA + 1n, true);
        await this.bitmap.$setTo(0, keyA + 2n, true);
        await this.bitmap.$setTo(0, keyA + 3n, true);
        await this.bitmap.$setTo(0, keyA + 4n, true);
        await this.bitmap.$setTo(0, keyA + 2n, false);
        await this.bitmap.$setTo(0, keyA + 4n, false);
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA + 0n)).to.eventually.be.true;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA + 1n)).to.eventually.be.true;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA + 2n)).to.eventually.be.false;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA + 3n)).to.eventually.be.true;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA + 4n)).to.eventually.be.false;
      });
    });

    describe('set', function () {
      it('adds a key', async function () {
        await this.bitmap.$set(0, keyA);
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA)).to.eventually.be.true;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyB)).to.eventually.be.false;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyC)).to.eventually.be.false;
      });

      it('adds several keys', async function () {
        await this.bitmap.$set(0, keyA);
        await this.bitmap.$set(0, keyB);
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA)).to.eventually.be.true;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyB)).to.eventually.be.true;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyC)).to.eventually.be.false;
      });

      it('adds several consecutive keys', async function () {
        await this.bitmap.$set(0, keyA + 0n);
        await this.bitmap.$set(0, keyA + 1n);
        await this.bitmap.$set(0, keyA + 3n);
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA + 0n)).to.eventually.be.true;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA + 1n)).to.eventually.be.true;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA + 2n)).to.eventually.be.false;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA + 3n)).to.eventually.be.true;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA + 4n)).to.eventually.be.false;
      });
    });

    describe('unset', function () {
      it('removes added keys', async function () {
        await this.bitmap.$set(0, keyA);
        await this.bitmap.$set(0, keyB);
        await this.bitmap.$unset(0, keyA);
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA)).to.eventually.be.false;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyB)).to.eventually.be.true;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyC)).to.eventually.be.false;
      });

      it('removes consecutive added keys', async function () {
        await this.bitmap.$set(0, keyA + 0n);
        await this.bitmap.$set(0, keyA + 1n);
        await this.bitmap.$set(0, keyA + 3n);
        await this.bitmap.$unset(0, keyA + 1n);
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA + 0n)).to.eventually.be.true;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA + 1n)).to.eventually.be.false;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA + 2n)).to.eventually.be.false;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA + 3n)).to.eventually.be.true;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA + 4n)).to.eventually.be.false;
      });

      it('adds and removes multiple keys', async function () {
        // []

        await this.bitmap.$set(0, keyA);
        await this.bitmap.$set(0, keyC);

        // [A, C]

        await this.bitmap.$unset(0, keyA);
        await this.bitmap.$unset(0, keyB);

        // [C]

        await this.bitmap.$set(0, keyB);

        // [C, B]

        await this.bitmap.$set(0, keyA);
        await this.bitmap.$unset(0, keyC);

        // [A, B]

        await this.bitmap.$set(0, keyA);
        await this.bitmap.$set(0, keyB);

        // [A, B]

        await this.bitmap.$set(0, keyC);
        await this.bitmap.$unset(0, keyA);

        // [B, C]

        await this.bitmap.$set(0, keyA);
        await this.bitmap.$unset(0, keyB);

        // [A, C]

        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyA)).to.eventually.be.true;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyB)).to.eventually.be.false;
        await expect(this.bitmap.$get_BitMaps_BitMap(0, keyC)).to.eventually.be.true;
      });
    });
  });

  // Packed value maps
  for (const { bits, name } of BITMAP_TYPES) {
    describe(name, function () {
      const max = (1n << BigInt(bits)) - 1n;
      const perBucket = 256 / bits;
      const wide = bits > 8;
      const get = (self, index) => self.bitmap[`$get_BitMaps_${name}`](0, index);
      const set = (self, index, value) =>
        wide
          ? self.bitmap.$set(0, index, ethers.Typed[`uint${bits}`](value))
          : self.bitmap[`$set_BitMaps_${name}`](0, index, value);

      it(`stores and retrieves ${bits}-bit values`, async function () {
        await set(this, 0n, 0n);
        await set(this, 1n, max);
        await expect(get(this, 0n)).to.eventually.equal(0n);
        await expect(get(this, 1n)).to.eventually.equal(max);
      });

      if (bits < 8) {
        it('truncates values wider than the map', async function () {
          await set(this, 0n, max + 1n); // one bit too wide -> wraps within the stored width
          await expect(get(this, 0n)).to.eventually.equal((max + 1n) & max);
        });
      }

      it('isolates values across the bucket boundary', async function () {
        await set(this, BigInt(perBucket - 1), max); // last value in bucket 0
        await set(this, BigInt(perBucket), max); // first value in bucket 1
        await expect(get(this, BigInt(perBucket - 1))).to.eventually.equal(max);
        await expect(get(this, BigInt(perBucket))).to.eventually.equal(max);
      });
    });
  }
});
