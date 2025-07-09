const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { MAX_UINT128, MAX_UINT64, MAX_UINT32, MAX_UINT16 } = require('../helpers/constants');

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
      expect(await this.mock.$indexOf(lorem, ethers.toBeHex(present))).to.equal(lorem.indexOf(present));
    });

    it('from index', async function () {
      for (const start in Array(lorem.length + 10).fill()) {
        const index = lorem.indexOf(present, start);
        const result = index === -1 ? ethers.MaxUint256 : index;
        expect(await this.mock.$indexOf(lorem, ethers.toBeHex(present), ethers.Typed.uint256(start))).to.equal(result);
      }
    });

    it('absent', async function () {
      expect(await this.mock.$indexOf(lorem, ethers.toBeHex(absent))).to.equal(ethers.MaxUint256);
    });
  });

  describe('lastIndexOf', function () {
    it('first', async function () {
      expect(await this.mock.$lastIndexOf(lorem, ethers.toBeHex(present))).to.equal(lorem.lastIndexOf(present));
    });

    it('from index', async function () {
      for (const start in Array(lorem.length + 10).fill()) {
        const index = lorem.lastIndexOf(present, start);
        const result = index === -1 ? ethers.MaxUint256 : index;
        expect(await this.mock.$lastIndexOf(lorem, ethers.toBeHex(present), ethers.Typed.uint256(start))).to.equal(
          result,
        );
      }
    });

    it('absent', async function () {
      expect(await this.mock.$lastIndexOf(lorem, ethers.toBeHex(absent))).to.equal(ethers.MaxUint256);
    });
  });

  describe('slice', function () {
    describe('slice(bytes, uint256)', function () {
      for (const [descr, start] of Object.entries({
        'start = 0': 0,
        'start within bound': 10,
        'start out of bound': 1000,
      })) {
        it(descr, async function () {
          const result = ethers.hexlify(lorem.slice(start));
          expect(await this.mock.$slice(lorem, start)).to.equal(result);
        });
      }
    });

    describe('slice(bytes, uint256, uint256)', function () {
      for (const [descr, [start, end]] of Object.entries({
        'start = 0': [0, 42],
        'start and end within bound': [17, 42],
        'end out of bound': [42, 1000],
        'start = end': [17, 17],
        'start > end': [42, 17],
      })) {
        it(descr, async function () {
          const result = ethers.hexlify(lorem.slice(start, end));
          expect(await this.mock.$slice(lorem, start, ethers.Typed.uint256(end))).to.equal(result);
        });
      }
    });
  });

  describe('nibbles', function () {
    it('converts single byte', async function () {
      await expect(this.mock.$nibbles('0xab')).to.eventually.equal('0xa00b');
    });

    it('converts multiple bytes', async function () {
      await expect(this.mock.$nibbles('0x1234')).to.eventually.equal('0x10023004');
    });

    it('handles empty bytes', async function () {
      await expect(this.mock.$nibbles('0x')).to.eventually.equal('0x');
    });

    it('converts lorem text', async function () {
      const result = await this.mock.$nibbles(lorem);
      expect(ethers.dataLength(result)).to.equal(lorem.length * 2);

      // Check nibble extraction for first few bytes
      for (let i = 0; i < Math.min(lorem.length, 5); i++) {
        const originalByte = lorem[i];
        const highNibble = ethers.dataSlice(result, i * 2, i * 2 + 1);
        const lowNibble = ethers.dataSlice(result, i * 2 + 1, i * 2 + 2);

        expect(highNibble).to.equal(ethers.toBeHex(originalByte & 0xf0, 1));
        expect(lowNibble).to.equal(ethers.toBeHex(originalByte & 0x0f, 1));
      }
    });
  });

  describe('clz', function () {
    it('zero value', async function () {
      await expect(this.mock.$clz(0)).to.eventually.equal(32);
    });

    it('small values', async function () {
      await expect(this.mock.$clz(1)).to.eventually.equal(31);
      await expect(this.mock.$clz(255)).to.eventually.equal(31);
    });

    it('larger values', async function () {
      await expect(this.mock.$clz(256)).to.eventually.equal(30);
      await expect(this.mock.$clz(0xff00)).to.eventually.equal(30);
      await expect(this.mock.$clz(0x10000)).to.eventually.equal(29);
    });

    it('max value', async function () {
      await expect(this.mock.$clz(ethers.MaxUint256)).to.eventually.equal(0);
    });

    it('specific patterns', async function () {
      await expect(
        this.mock.$clz('0x0000000000000000000000000000000000000000000000000000000000000100'),
      ).to.eventually.equal(30);
      await expect(
        this.mock.$clz('0x0000000000000000000000000000000000000000000000000000000000010000'),
      ).to.eventually.equal(29);
      await expect(
        this.mock.$clz('0x0000000000000000000000000000000000000000000000000000000001000000'),
      ).to.eventually.equal(28);
    });
  });

  describe('reverseBits', function () {
    describe('reverseBits256', function () {
      it('reverses bytes correctly', async function () {
        await expect(this.mock.$reverseBits256(bytes32(0))).to.eventually.equal(bytes32(0));
        await expect(this.mock.$reverseBits256(bytes32(ethers.MaxUint256))).to.eventually.equal(
          bytes32(ethers.MaxUint256),
        );

        // Test complex pattern that clearly shows byte reversal
        await expect(
          this.mock.$reverseBits256('0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
        ).to.eventually.equal('0xefcdab8967452301efcdab8967452301efcdab8967452301efcdab8967452301');
      });

      it('double reverse returns original', async function () {
        const values = [0n, 1n, 0x12345678n, ethers.MaxUint256];
        for (const value of values) {
          const reversed = await this.mock.$reverseBits256(bytes32(value));
          await expect(this.mock.$reverseBits256(reversed)).to.eventually.equal(bytes32(value));
        }
      });
    });

    describe('reverseBits128', function () {
      it('reverses bytes correctly', async function () {
        await expect(this.mock.$reverseBits128(bytes16(0))).to.eventually.equal(bytes16(0));
        await expect(this.mock.$reverseBits128(bytes16(MAX_UINT128))).to.eventually.equal(bytes16(MAX_UINT128));

        // Test complex pattern that clearly shows byte reversal
        await expect(this.mock.$reverseBits128('0x0123456789abcdef0123456789abcdef')).to.eventually.equal(
          '0xefcdab8967452301efcdab8967452301',
        );
      });

      it('double reverse returns original', async function () {
        const values = [0n, 1n, 0x12345678n, MAX_UINT128];
        for (const value of values) {
          const reversed = await this.mock.$reverseBits128(bytes16(value));
          // Cast back to uint128 for comparison since function returns uint256
          await expect(this.mock.$reverseBits128(reversed)).to.eventually.equal(bytes16(value & MAX_UINT128));
        }
      });
    });

    describe('reverseBits64', function () {
      it('reverses bytes correctly', async function () {
        await expect(this.mock.$reverseBits64(bytes8(0))).to.eventually.equal(bytes8(0));
        await expect(this.mock.$reverseBits64(bytes8(MAX_UINT64))).to.eventually.equal(bytes8(MAX_UINT64));

        // Test known pattern: 0x123456789ABCDEF0 -> 0xF0DEBC9A78563412
        await expect(this.mock.$reverseBits64('0x123456789abcdef0')).to.eventually.equal('0xf0debc9a78563412');
      });

      it('double reverse returns original', async function () {
        const values = [0n, 1n, 0x12345678n, MAX_UINT64];
        for (const value of values) {
          const reversed = await this.mock.$reverseBits64(bytes8(value));
          // Cast back to uint64 for comparison since function returns uint256
          await expect(this.mock.$reverseBits64(reversed)).to.eventually.equal(bytes8(value & MAX_UINT64));
        }
      });
    });

    describe('reverseBits32', function () {
      it('reverses bytes correctly', async function () {
        await expect(this.mock.$reverseBits32(bytes4(0))).to.eventually.equal(bytes4(0));
        await expect(this.mock.$reverseBits32(bytes4(MAX_UINT32))).to.eventually.equal(bytes4(MAX_UINT32));

        // Test known pattern: 0x12345678 -> 0x78563412
        await expect(this.mock.$reverseBits32(bytes4(0x12345678))).to.eventually.equal(bytes4(0x78563412));
      });

      it('double reverse returns original', async function () {
        const values = [0n, 1n, 0x12345678n, MAX_UINT32];
        for (const value of values) {
          const reversed = await this.mock.$reverseBits32(bytes4(value));
          // Cast back to uint32 for comparison since function returns uint256
          await expect(this.mock.$reverseBits32(reversed)).to.eventually.equal(bytes4(value & MAX_UINT32));
        }
      });
    });

    describe('reverseBits16', function () {
      it('reverses bytes correctly', async function () {
        await expect(this.mock.$reverseBits16(bytes2(0))).to.eventually.equal(bytes2(0));
        await expect(this.mock.$reverseBits16(bytes2(MAX_UINT16))).to.eventually.equal(bytes2(MAX_UINT16));

        // Test known pattern: 0x1234 -> 0x3412
        await expect(this.mock.$reverseBits16(bytes2(0x1234))).to.eventually.equal(bytes2(0x3412));
      });

      it('double reverse returns original', async function () {
        const values = [0n, 1n, 0x1234n, MAX_UINT16];
        for (const value of values) {
          const reversed = await this.mock.$reverseBits16(bytes2(value));
          // Cast back to uint16 for comparison since function returns uint256
          await expect(this.mock.$reverseBits16(reversed)).to.eventually.equal(bytes2(value & MAX_UINT16));
        }
      });
    });

    describe('edge cases', function () {
      it('handles single byte values', async function () {
        await expect(this.mock.$reverseBits16(bytes2(0x00ff))).to.eventually.equal(bytes2(0xff00));
        await expect(this.mock.$reverseBits32(bytes4(0x000000ff))).to.eventually.equal(bytes4(0xff000000));
      });

      it('handles alternating patterns', async function () {
        await expect(this.mock.$reverseBits16(bytes2(0xaaaa))).to.eventually.equal(bytes2(0xaaaa));
        await expect(this.mock.$reverseBits16(bytes2(0x5555))).to.eventually.equal(bytes2(0x5555));
        await expect(this.mock.$reverseBits32(bytes4(0xaaaaaaaa))).to.eventually.equal(bytes4(0xaaaaaaaa));
        await expect(this.mock.$reverseBits32(bytes4(0x55555555))).to.eventually.equal(bytes4(0x55555555));
      });
    });
  });
});
