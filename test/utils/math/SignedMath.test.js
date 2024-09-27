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
});
