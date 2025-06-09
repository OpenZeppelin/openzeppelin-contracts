const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

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

  describe('equal', function () {
    it('identical arrays', async function () {
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

    it('empty arrays', async function () {
      const empty1 = new Uint8Array(0);
      const empty2 = new Uint8Array(0);
      await expect(this.mock.$equal(empty1, empty2)).to.eventually.be.true;
    });

    it('one empty one not', async function () {
      const empty = new Uint8Array(0);
      await expect(this.mock.$equal(lorem, empty)).to.eventually.be.false;
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
});
