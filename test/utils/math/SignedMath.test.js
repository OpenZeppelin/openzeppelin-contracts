const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { min, max } = require('../../helpers/math');

async function testCommutative(fn, lhs, rhs, expected, ...extra) {
  expect(await fn(lhs, rhs, ...extra)).to.deep.equal(expected);
  expect(await fn(rhs, lhs, ...extra)).to.deep.equal(expected);
}

async function fixture() {
  const mock = await ethers.deployContract('$SignedMath');
  return { mock };
}

describe('SignedMath', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('max', function () {
    it('is correctly detected in both position', async function () {
      await testCommutative(this.mock.$max, -1234n, 5678n, max(-1234n, 5678n));
    });
  });

  describe('min', function () {
    it('is correctly detected in both position', async function () {
      await testCommutative(this.mock.$min, -1234n, 5678n, min(-1234n, 5678n));
    });
  });

  describe('average', function () {
    it('is correctly calculated with various input', async function () {
      for (const x of [ethers.MinInt256, -57417n, -42304n, -4n, -3n, 0n, 3n, 4n, 42304n, 57417n, ethers.MaxInt256]) {
        for (const y of [ethers.MinInt256, -57417n, -42304n, -5n, -2n, 0n, 2n, 5n, 42304n, 57417n, ethers.MaxInt256]) {
          expect(await this.mock.$average(x, y)).to.equal((x + y) / 2n);
        }
      }
    });
  });

  describe('abs', function () {
    const abs = x => (x < 0n ? -x : x);

    for (const n of [ethers.MinInt256, ethers.MinInt256 + 1n, -1n, 0n, 1n, ethers.MaxInt256 - 1n, ethers.MaxInt256]) {
      it(`correctly computes the absolute value of ${n}`, async function () {
        expect(await this.mock.$abs(n)).to.equal(abs(n));
      });
    }
  });
});
