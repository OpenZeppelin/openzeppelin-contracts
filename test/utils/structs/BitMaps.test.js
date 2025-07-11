const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const bitmap = await ethers.deployContract('$BitMaps');
  return { bitmap };
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

  describe('PairMap', function () {
    it('stores and retrieves 2-bit values', async function () {
      await this.bitmap.$set_BitMaps_PairMap(1, 0n, 0);
      await this.bitmap.$set_BitMaps_PairMap(1, 1n, 1);
      await this.bitmap.$set_BitMaps_PairMap(1, 2n, 2);
      await this.bitmap.$set_BitMaps_PairMap(1, 3n, 3);

      await expect(this.bitmap.$get_BitMaps_PairMap(1, 0n)).to.eventually.equal(0);
      await expect(this.bitmap.$get_BitMaps_PairMap(1, 1n)).to.eventually.equal(1);
      await expect(this.bitmap.$get_BitMaps_PairMap(1, 2n)).to.eventually.equal(2);
      await expect(this.bitmap.$get_BitMaps_PairMap(1, 3n)).to.eventually.equal(3);
    });

    it('truncates values larger than 3', async function () {
      await this.bitmap.$set_BitMaps_PairMap(1, 0n, 4); // Should become 0
      await this.bitmap.$set_BitMaps_PairMap(1, 1n, 5); // Should become 1
      await this.bitmap.$set_BitMaps_PairMap(1, 2n, 6); // Should become 2
      await this.bitmap.$set_BitMaps_PairMap(1, 3n, 7); // Should become 3

      await expect(this.bitmap.$get_BitMaps_PairMap(1, 0n)).to.eventually.equal(0);
      await expect(this.bitmap.$get_BitMaps_PairMap(1, 1n)).to.eventually.equal(1);
      await expect(this.bitmap.$get_BitMaps_PairMap(1, 2n)).to.eventually.equal(2);
      await expect(this.bitmap.$get_BitMaps_PairMap(1, 3n)).to.eventually.equal(3);
    });

    it('handles multiple buckets', async function () {
      // Test across bucket boundary (128 values per bucket)
      await this.bitmap.$set_BitMaps_PairMap(1, 127n, 2);
      await this.bitmap.$set_BitMaps_PairMap(1, 128n, 3);

      await expect(this.bitmap.$get_BitMaps_PairMap(1, 127n)).to.eventually.equal(2);
      await expect(this.bitmap.$get_BitMaps_PairMap(1, 128n)).to.eventually.equal(3);
    });
  });

  describe('NibbleMap', function () {
    it('stores and retrieves 4-bit values', async function () {
      await this.bitmap.$set_BitMaps_NibbleMap(2, 0n, 0);
      await this.bitmap.$set_BitMaps_NibbleMap(2, 1n, 5);
      await this.bitmap.$set_BitMaps_NibbleMap(2, 2n, 10);
      await this.bitmap.$set_BitMaps_NibbleMap(2, 3n, 15);

      await expect(this.bitmap.$get_BitMaps_NibbleMap(2, 0n)).to.eventually.equal(0);
      await expect(this.bitmap.$get_BitMaps_NibbleMap(2, 1n)).to.eventually.equal(5);
      await expect(this.bitmap.$get_BitMaps_NibbleMap(2, 2n)).to.eventually.equal(10);
      await expect(this.bitmap.$get_BitMaps_NibbleMap(2, 3n)).to.eventually.equal(15);
    });

    it('truncates values larger than 15', async function () {
      await this.bitmap.$set_BitMaps_NibbleMap(2, 0n, 16); // Should become 0
      await this.bitmap.$set_BitMaps_NibbleMap(2, 1n, 17); // Should become 1
      await this.bitmap.$set_BitMaps_NibbleMap(2, 2n, 30); // Should become 14
      await this.bitmap.$set_BitMaps_NibbleMap(2, 3n, 31); // Should become 15

      await expect(this.bitmap.$get_BitMaps_NibbleMap(2, 0n)).to.eventually.equal(0);
      await expect(this.bitmap.$get_BitMaps_NibbleMap(2, 1n)).to.eventually.equal(1);
      await expect(this.bitmap.$get_BitMaps_NibbleMap(2, 2n)).to.eventually.equal(14);
      await expect(this.bitmap.$get_BitMaps_NibbleMap(2, 3n)).to.eventually.equal(15);
    });
  });

  describe('Uint8Map', function () {
    it('stores and retrieves uint8 values', async function () {
      await this.bitmap.$set_BitMaps_Uint8Map(3, 0n, ethers.Typed.uint8(0));
      await this.bitmap.$set_BitMaps_Uint8Map(3, 1n, ethers.Typed.uint8(42));
      await this.bitmap.$set_BitMaps_Uint8Map(3, 2n, ethers.Typed.uint8(255));

      await expect(this.bitmap.$get_BitMaps_Uint8Map(3, 0n)).to.eventually.equal(0);
      await expect(this.bitmap.$get_BitMaps_Uint8Map(3, 1n)).to.eventually.equal(42);
      await expect(this.bitmap.$get_BitMaps_Uint8Map(3, 2n)).to.eventually.equal(255);
    });

    it('handles bucket boundaries', async function () {
      // 32 values per bucket for Uint8Map
      await this.bitmap.$set_BitMaps_Uint8Map(3, 31n, ethers.Typed.uint8(100));
      await this.bitmap.$set_BitMaps_Uint8Map(3, 32n, ethers.Typed.uint8(200));

      await expect(this.bitmap.$get_BitMaps_Uint8Map(3, 31n)).to.eventually.equal(100);
      await expect(this.bitmap.$get_BitMaps_Uint8Map(3, 32n)).to.eventually.equal(200);
    });
  });

  describe('Uint16Map', function () {
    it('stores and retrieves uint16 values', async function () {
      await this.bitmap.$set(4, 0n, ethers.Typed.uint16(0));
      await this.bitmap.$set(4, 1n, ethers.Typed.uint16(1000));
      await this.bitmap.$set(4, 2n, ethers.Typed.uint16(65535));

      await expect(this.bitmap.$get_BitMaps_Uint16Map(4, 0n)).to.eventually.equal(0);
      await expect(this.bitmap.$get_BitMaps_Uint16Map(4, 1n)).to.eventually.equal(1000);
      await expect(this.bitmap.$get_BitMaps_Uint16Map(4, 2n)).to.eventually.equal(65535);
    });

    it('handles bucket boundaries', async function () {
      // 16 values per bucket for Uint16Map
      await this.bitmap.$set(4, 15n, ethers.Typed.uint16(100));
      await this.bitmap.$set(4, 16n, ethers.Typed.uint16(200));

      await expect(this.bitmap.$get_BitMaps_Uint16Map(4, 15n)).to.eventually.equal(100);
      await expect(this.bitmap.$get_BitMaps_Uint16Map(4, 16n)).to.eventually.equal(200);
    });
  });

  describe('Uint32Map', function () {
    it('stores and retrieves uint32 values', async function () {
      await this.bitmap.$set(5, 0n, ethers.Typed.uint32(0));
      await this.bitmap.$set(5, 1n, ethers.Typed.uint32(1000000));
      await this.bitmap.$set(5, 2n, ethers.Typed.uint32(4294967295)); // 2^32 - 1

      await expect(this.bitmap.$get_BitMaps_Uint32Map(5, 0n)).to.eventually.equal(0);
      await expect(this.bitmap.$get_BitMaps_Uint32Map(5, 1n)).to.eventually.equal(1000000);
      await expect(this.bitmap.$get_BitMaps_Uint32Map(5, 2n)).to.eventually.equal(4294967295);
    });

    it('handles bucket boundaries', async function () {
      // 32 values per bucket for Uint32Map
      await this.bitmap.$set(5, 31n, ethers.Typed.uint32(100));
      await this.bitmap.$set(5, 32n, ethers.Typed.uint32(200));

      await expect(this.bitmap.$get_BitMaps_Uint32Map(5, 31n)).to.eventually.equal(100);
      await expect(this.bitmap.$get_BitMaps_Uint32Map(5, 32n)).to.eventually.equal(200);
    });
  });

  describe('Uint64Map', function () {
    it('stores and retrieves uint64 values', async function () {
      const maxUint64 = (1n << 64n) - 1n;

      await this.bitmap.$set(6, 0n, ethers.Typed.uint64(0));
      await this.bitmap.$set(6, 1n, ethers.Typed.uint64(1000000000));
      await this.bitmap.$set(6, 2n, ethers.Typed.uint64(maxUint64));

      await expect(this.bitmap.$get_BitMaps_Uint64Map(6, 0n)).to.eventually.equal(0);
      await expect(this.bitmap.$get_BitMaps_Uint64Map(6, 1n)).to.eventually.equal(1000000000);
      await expect(this.bitmap.$get_BitMaps_Uint64Map(6, 2n)).to.eventually.equal(maxUint64);
    });
  });

  describe('Uint128Map', function () {
    it('stores and retrieves uint128 values', async function () {
      const maxUint128 = (1n << 128n) - 1n;
      const largeValue = 1n << 100n;

      await this.bitmap.$set(7, 0n, ethers.Typed.uint128(0));
      await this.bitmap.$set(7, 1n, ethers.Typed.uint128(largeValue));
      await this.bitmap.$set(7, 2n, ethers.Typed.uint128(maxUint128));

      await expect(this.bitmap.$get_BitMaps_Uint128Map(7, 0n)).to.eventually.equal(0);
      await expect(this.bitmap.$get_BitMaps_Uint128Map(7, 1n)).to.eventually.equal(largeValue);
      await expect(this.bitmap.$get_BitMaps_Uint128Map(7, 2n)).to.eventually.equal(maxUint128);
    });

    it('handles bucket boundaries', async function () {
      // Uint128Map has 2 values per bucket
      await this.bitmap.$set(7, 31n, ethers.Typed.uint128(100));
      await this.bitmap.$set(7, 32n, ethers.Typed.uint128(200));

      await expect(this.bitmap.$get_BitMaps_Uint128Map(7, 31n)).to.eventually.equal(100);
      await expect(this.bitmap.$get_BitMaps_Uint128Map(7, 32n)).to.eventually.equal(200);
    });
  });
});
