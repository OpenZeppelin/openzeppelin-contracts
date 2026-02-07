const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { MAX_UINT128, MAX_UINT64, MAX_UINT32, MAX_UINT16 } = require('../helpers/constants');
const { generators } = require('../helpers/random');

// Helper functions for fixed bytes types
const bytes32 = value => ethers.toBeHex(value, 32);
const bytes16 = value => ethers.toBeHex(value, 16);
const bytes8 = value => ethers.toBeHex(value, 8);
const bytes4 = value => ethers.toBeHex(value, 4);
const bytes2 = value => ethers.toBeHex(value, 2);

async function fixture() {
  const mock = await ethers.deployContract('$Bytes');
  return { mock };
}

const lorem = ethers.toUtf8Bytes(
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
);
const present = lorem.at(1);
const absent = 255;

describe('Bytes', function () {
  before(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('indexOf', function () {
    it('first', async function () {
      await expect(this.mock.$indexOf(lorem, ethers.toBeHex(present))).to.eventually.equal(lorem.indexOf(present));
    });

    it('from index', async function () {
      for (const start in Array(lorem.length + 10).fill()) {
        const index = lorem.indexOf(present, start);
        const result = index === -1 ? ethers.MaxUint256 : index;
        await expect(
          this.mock.$indexOf(lorem, ethers.toBeHex(present), ethers.Typed.uint256(start)),
        ).to.eventually.equal(result);
      }
    });

    it('absent', async function () {
      await expect(this.mock.$indexOf(lorem, ethers.toBeHex(absent))).to.eventually.equal(ethers.MaxUint256);
    });

    it('empty buffer', async function () {
      await expect(this.mock.$indexOf('0x', '0x00')).to.eventually.equal(ethers.MaxUint256);
      await expect(this.mock.$indexOf('0x', '0x00', ethers.Typed.uint256(17))).to.eventually.equal(ethers.MaxUint256);
    });
  });

  describe('lastIndexOf', function () {
    it('first', async function () {
      await expect(this.mock.$lastIndexOf(lorem, ethers.toBeHex(present))).to.eventually.equal(
        lorem.lastIndexOf(present),
      );
    });

    it('from index', async function () {
      for (const start in Array(lorem.length + 10).fill()) {
        const index = lorem.lastIndexOf(present, start);
        const result = index === -1 ? ethers.MaxUint256 : index;
        await expect(
          this.mock.$lastIndexOf(lorem, ethers.toBeHex(present), ethers.Typed.uint256(start)),
        ).to.eventually.equal(result);
      }
    });

    it('absent', async function () {
      await expect(this.mock.$lastIndexOf(lorem, ethers.toBeHex(absent))).to.eventually.equal(ethers.MaxUint256);
    });

    it('empty buffer', async function () {
      await expect(this.mock.$lastIndexOf('0x', '0x00')).to.eventually.equal(ethers.MaxUint256);
      await expect(this.mock.$lastIndexOf('0x', '0x00', ethers.Typed.uint256(17))).to.eventually.equal(
        ethers.MaxUint256,
      );
    });
  });

  describe('slice & splice', function () {
    describe('slice(bytes, uint256) & splice(bytes, uint256)', function () {
      for (const [descr, start] of Object.entries({
        'start = 0': 0,
        'start within bound': 10,
        'start out of bound': 1000,
      })) {
        it(descr, async function () {
          const result = ethers.hexlify(lorem.slice(start));
          await expect(this.mock.$slice(lorem, start)).to.eventually.equal(result);
          await expect(this.mock.$splice(lorem, start)).to.eventually.equal(result);
        });
      }
    });

    describe('slice(bytes, uint256, uint256) & splice(bytes, uint256, uint256)', function () {
      for (const [descr, [start, end]] of Object.entries({
        'start = 0': [0, 42],
        'start and end within bound': [17, 42],
        'end out of bound': [42, 1000],
        'start = end': [17, 17],
        'start > end': [42, 17],
      })) {
        it(descr, async function () {
          const result = ethers.hexlify(lorem.slice(start, end));
          await expect(this.mock.$slice(lorem, start, ethers.Typed.uint256(end))).to.eventually.equal(result);
          await expect(this.mock.$splice(lorem, start, ethers.Typed.uint256(end))).to.eventually.equal(result);
        });
      }
    });
  });

  describe('concat', function () {
    it('empty list', async function () {
      await expect(this.mock.$concat([])).to.eventually.equal(generators.bytes.zero);
    });

    it('single item', async function () {
      const item = generators.bytes();
      await expect(this.mock.$concat([item])).to.eventually.equal(item);
    });

    it('multiple (non-empty) items', async function () {
      const items = Array.from({ length: 17 }, generators.bytes);
      await expect(this.mock.$concat(items)).to.eventually.equal(ethers.concat(items));
    });

    it('multiple (empty) items', async function () {
      const items = Array.from({ length: 17 }).fill(generators.bytes.zero);
      await expect(this.mock.$concat(items)).to.eventually.equal(ethers.concat(items));
    });

    it('multiple (variable length) items', async function () {
      const items = [
        generators.bytes.zero,
        generators.bytes(17),
        generators.bytes.zero,
        generators.bytes(42),
        generators.bytes(1),
        generators.bytes(256),
        generators.bytes(1024),
        generators.bytes.zero,
        generators.bytes(7),
        generators.bytes(15),
        generators.bytes(63),
        generators.bytes.zero,
        generators.bytes.zero,
      ];

      await expect(this.mock.$concat(items)).to.eventually.equal(ethers.concat(items));
    });
  });

  describe('clz bytes', function () {
    it('empty buffer', async function () {
      await expect(this.mock.$clz('0x')).to.eventually.equal(0);
    });

    it('single zero byte', async function () {
      await expect(this.mock.$clz('0x00')).to.eventually.equal(8);
    });

    it('single non-zero byte', async function () {
      await expect(this.mock.$clz('0x01')).to.eventually.equal(7);
      await expect(this.mock.$clz('0xff')).to.eventually.equal(0);
    });

    it('multiple leading zeros', async function () {
      await expect(this.mock.$clz('0x0000000001')).to.eventually.equal(39);
      await expect(
        this.mock.$clz('0x0000000000000000000000000000000000000000000000000000000000000001'),
      ).to.eventually.equal(255);
    });

    it('all zeros of various lengths', async function () {
      await expect(this.mock.$clz('0x00000000')).to.eventually.equal(32);
      await expect(
        this.mock.$clz('0x0000000000000000000000000000000000000000000000000000000000000000'),
      ).to.eventually.equal(256);

      // Complete chunks
      await expect(this.mock.$clz('0x' + '00'.repeat(32) + '01')).to.eventually.equal(263); // 32*8+7
      await expect(this.mock.$clz('0x' + '00'.repeat(64) + '01')).to.eventually.equal(519); // 64*8+7

      // Partial last chunk
      await expect(this.mock.$clz('0x' + '00'.repeat(33) + '01')).to.eventually.equal(271); // 33*8+7
      await expect(this.mock.$clz('0x' + '00'.repeat(34) + '01')).to.eventually.equal(279); // 34*8+7
      await expect(this.mock.$clz('0x' + '00'.repeat(40) + '01' + '00'.repeat(9))).to.eventually.equal(327); // 40*8+7
      await expect(this.mock.$clz('0x' + '00'.repeat(50))).to.eventually.equal(400); // 50*8

      // First byte of each chunk non-zero
      await expect(this.mock.$clz('0x80' + '00'.repeat(31))).to.eventually.equal(0);
      await expect(this.mock.$clz('0x01' + '00'.repeat(31))).to.eventually.equal(7);
      await expect(this.mock.$clz('0x' + '00'.repeat(32) + '80' + '00'.repeat(31))).to.eventually.equal(256); // 32*8
      await expect(this.mock.$clz('0x' + '00'.repeat(32) + '01' + '00'.repeat(31))).to.eventually.equal(263); // 32*8+7

      // Last byte of each chunk non-zero
      await expect(this.mock.$clz('0x' + '00'.repeat(31) + '01')).to.eventually.equal(255); // 31*8+7
      await expect(this.mock.$clz('0x' + '00'.repeat(63) + '01')).to.eventually.equal(511); // 63*8+7

      // Middle byte of each chunk non-zero
      await expect(this.mock.$clz('0x' + '00'.repeat(16) + '01' + '00'.repeat(15))).to.eventually.equal(135); // 16*8+7
      await expect(this.mock.$clz('0x' + '00'.repeat(32) + '01' + '00'.repeat(31))).to.eventually.equal(263); // 32*8+7
      await expect(this.mock.$clz('0x' + '00'.repeat(48) + '01' + '00'.repeat(47))).to.eventually.equal(391); // 48*8+7
      await expect(this.mock.$clz('0x' + '00'.repeat(64) + '01' + '00'.repeat(63))).to.eventually.equal(519); // 64*8+7
    });
  });

  describe('nibbles', function () {
    it('full input', async function () {
      await expect(this.mock.$toNibbles('0x0123456789abcdef')).to.eventually.equal(
        '0x000102030405060708090a0b0c0d0e0f',
      );
    });

    it('empty input', async function () {
      await expect(this.mock.$toNibbles('0x')).to.eventually.equal('0x');
    });
  });

  describe('equal', function () {
    it('identical buffers', async function () {
      await expect(this.mock.$equal(lorem, lorem)).to.eventually.be.true;
    });

    it('same content', async function () {
      const copy = new Uint8Array(lorem);
      await expect(this.mock.$equal(lorem, copy)).to.eventually.be.true;
    });

    it('different content', async function () {
      const different = ethers.toUtf8Bytes('Different content');
      await expect(this.mock.$equal(lorem, different)).to.eventually.be.false;
    });

    it('different lengths', async function () {
      const shorter = lorem.slice(0, 10);
      await expect(this.mock.$equal(lorem, shorter)).to.eventually.be.false;
    });

    it('empty buffers', async function () {
      const empty1 = new Uint8Array(0);
      const empty2 = new Uint8Array(0);
      await expect(this.mock.$equal(empty1, empty2)).to.eventually.be.true;
    });

    it('one empty one not', async function () {
      const empty = new Uint8Array(0);
      await expect(this.mock.$equal(lorem, empty)).to.eventually.be.false;
    });
  });

  describe('reverseBits', function () {
    describe('reverseBytes32', function () {
      it('reverses bytes correctly', async function () {
        await expect(this.mock.$reverseBytes32(bytes32(0))).to.eventually.equal(bytes32(0));
        await expect(this.mock.$reverseBytes32(bytes32(ethers.MaxUint256))).to.eventually.equal(
          bytes32(ethers.MaxUint256),
        );

        // Test complex pattern that clearly shows byte reversal
        await expect(
          this.mock.$reverseBytes32('0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
        ).to.eventually.equal('0xefcdab8967452301efcdab8967452301efcdab8967452301efcdab8967452301');
      });

      it('double reverse returns original', async function () {
        const values = [0n, 1n, 0x12345678n, ethers.MaxUint256];
        for (const value of values) {
          const reversed = await this.mock.$reverseBytes32(bytes32(value));
          await expect(this.mock.$reverseBytes32(reversed)).to.eventually.equal(bytes32(value));
        }
      });
    });

    describe('reverseBytes16', function () {
      it('reverses bytes correctly', async function () {
        await expect(this.mock.$reverseBytes16(bytes16(0))).to.eventually.equal(bytes16(0));
        await expect(this.mock.$reverseBytes16(bytes16(MAX_UINT128))).to.eventually.equal(bytes16(MAX_UINT128));

        // Test complex pattern that clearly shows byte reversal
        await expect(this.mock.$reverseBytes16('0x0123456789abcdef0123456789abcdef')).to.eventually.equal(
          '0xefcdab8967452301efcdab8967452301',
        );
      });

      it('double reverse returns original', async function () {
        const values = [0n, 1n, 0x12345678n, MAX_UINT128];
        for (const value of values) {
          const reversed = await this.mock.$reverseBytes16(bytes16(value));
          // Cast back to uint128 for comparison since function returns uint256
          await expect(this.mock.$reverseBytes16(reversed)).to.eventually.equal(bytes16(value & MAX_UINT128));
        }
      });
    });

    describe('reverseBytes8', function () {
      it('reverses bytes correctly', async function () {
        await expect(this.mock.$reverseBytes8(bytes8(0))).to.eventually.equal(bytes8(0));
        await expect(this.mock.$reverseBytes8(bytes8(MAX_UINT64))).to.eventually.equal(bytes8(MAX_UINT64));

        // Test known pattern: 0x123456789ABCDEF0 -> 0xF0DEBC9A78563412
        await expect(this.mock.$reverseBytes8('0x123456789abcdef0')).to.eventually.equal('0xf0debc9a78563412');
      });

      it('double reverse returns original', async function () {
        const values = [0n, 1n, 0x12345678n, MAX_UINT64];
        for (const value of values) {
          const reversed = await this.mock.$reverseBytes8(bytes8(value));
          // Cast back to uint64 for comparison since function returns uint256
          await expect(this.mock.$reverseBytes8(reversed)).to.eventually.equal(bytes8(value & MAX_UINT64));
        }
      });
    });

    describe('reverseBytes4', function () {
      it('reverses bytes correctly', async function () {
        await expect(this.mock.$reverseBytes4(bytes4(0))).to.eventually.equal(bytes4(0));
        await expect(this.mock.$reverseBytes4(bytes4(MAX_UINT32))).to.eventually.equal(bytes4(MAX_UINT32));

        // Test known pattern: 0x12345678 -> 0x78563412
        await expect(this.mock.$reverseBytes4(bytes4(0x12345678))).to.eventually.equal(bytes4(0x78563412));
      });

      it('double reverse returns original', async function () {
        const values = [0n, 1n, 0x12345678n, MAX_UINT32];
        for (const value of values) {
          const reversed = await this.mock.$reverseBytes4(bytes4(value));
          // Cast back to uint32 for comparison since function returns uint256
          await expect(this.mock.$reverseBytes4(reversed)).to.eventually.equal(bytes4(value & MAX_UINT32));
        }
      });
    });

    describe('reverseBytes2', function () {
      it('reverses bytes correctly', async function () {
        await expect(this.mock.$reverseBytes2(bytes2(0))).to.eventually.equal(bytes2(0));
        await expect(this.mock.$reverseBytes2(bytes2(MAX_UINT16))).to.eventually.equal(bytes2(MAX_UINT16));

        // Test known pattern: 0x1234 -> 0x3412
        await expect(this.mock.$reverseBytes2(bytes2(0x1234))).to.eventually.equal(bytes2(0x3412));
      });

      it('double reverse returns original', async function () {
        const values = [0n, 1n, 0x1234n, MAX_UINT16];
        for (const value of values) {
          const reversed = await this.mock.$reverseBytes2(bytes2(value));
          // Cast back to uint16 for comparison since function returns uint256
          await expect(this.mock.$reverseBytes2(reversed)).to.eventually.equal(bytes2(value & MAX_UINT16));
        }
      });
    });

    describe('edge cases', function () {
      it('handles single byte values', async function () {
        await expect(this.mock.$reverseBytes2(bytes2(0x00ff))).to.eventually.equal(bytes2(0xff00));
        await expect(this.mock.$reverseBytes4(bytes4(0x000000ff))).to.eventually.equal(bytes4(0xff000000));
      });

      it('handles alternating patterns', async function () {
        await expect(this.mock.$reverseBytes2(bytes2(0xaaaa))).to.eventually.equal(bytes2(0xaaaa));
        await expect(this.mock.$reverseBytes2(bytes2(0x5555))).to.eventually.equal(bytes2(0x5555));
        await expect(this.mock.$reverseBytes4(bytes4(0xaaaaaaaa))).to.eventually.equal(bytes4(0xaaaaaaaa));
        await expect(this.mock.$reverseBytes4(bytes4(0x55555555))).to.eventually.equal(bytes4(0x55555555));
      });
    });
  });
});
