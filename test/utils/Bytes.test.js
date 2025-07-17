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

  describe('slice', function () {
    describe('slice(bytes, uint256)', function () {
      for (const [descr, start] of Object.entries({
        'start = 0': 0,
        'start within bound': 10,
        'start out of bound': 1000,
      })) {
        it(descr, async function () {
          const result = ethers.hexlify(lorem.slice(start));
          await expect(this.mock.$slice(lorem, start)).to.eventually.equal(result);
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
          await expect(this.mock.$slice(lorem, start, ethers.Typed.uint256(end))).to.eventually.equal(result);
        });
      }
    });
  });
});
