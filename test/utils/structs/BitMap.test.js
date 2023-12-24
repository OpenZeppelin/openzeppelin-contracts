const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const bitmap = await ethers.deployContract('$BitMaps');
  return { bitmap };
}

describe('BitMap', function () {
  const keyA = 7891n;
  const keyB = 451n;
  const keyC = 9592328n;

  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('starts empty', async function () {
    expect(await this.bitmap.$get(0, keyA)).to.equal(false);
    expect(await this.bitmap.$get(0, keyB)).to.equal(false);
    expect(await this.bitmap.$get(0, keyC)).to.equal(false);
  });

  describe('setTo', function () {
    it('set a key to true', async function () {
      await this.bitmap.$setTo(0, keyA, true);
      expect(await this.bitmap.$get(0, keyA)).to.equal(true);
      expect(await this.bitmap.$get(0, keyB)).to.equal(false);
      expect(await this.bitmap.$get(0, keyC)).to.equal(false);
    });

    it('set a key to false', async function () {
      await this.bitmap.$setTo(0, keyA, true);
      await this.bitmap.$setTo(0, keyA, false);
      expect(await this.bitmap.$get(0, keyA)).to.equal(false);
      expect(await this.bitmap.$get(0, keyB)).to.equal(false);
      expect(await this.bitmap.$get(0, keyC)).to.equal(false);
    });

    it('set several consecutive keys', async function () {
      await this.bitmap.$setTo(0, keyA + 0n, true);
      await this.bitmap.$setTo(0, keyA + 1n, true);
      await this.bitmap.$setTo(0, keyA + 2n, true);
      await this.bitmap.$setTo(0, keyA + 3n, true);
      await this.bitmap.$setTo(0, keyA + 4n, true);
      await this.bitmap.$setTo(0, keyA + 2n, false);
      await this.bitmap.$setTo(0, keyA + 4n, false);
      expect(await this.bitmap.$get(0, keyA + 0n)).to.equal(true);
      expect(await this.bitmap.$get(0, keyA + 1n)).to.equal(true);
      expect(await this.bitmap.$get(0, keyA + 2n)).to.equal(false);
      expect(await this.bitmap.$get(0, keyA + 3n)).to.equal(true);
      expect(await this.bitmap.$get(0, keyA + 4n)).to.equal(false);
    });
  });

  describe('set', function () {
    it('adds a key', async function () {
      await this.bitmap.$set(0, keyA);
      expect(await this.bitmap.$get(0, keyA)).to.equal(true);
      expect(await this.bitmap.$get(0, keyB)).to.equal(false);
      expect(await this.bitmap.$get(0, keyC)).to.equal(false);
    });

    it('adds several keys', async function () {
      await this.bitmap.$set(0, keyA);
      await this.bitmap.$set(0, keyB);
      expect(await this.bitmap.$get(0, keyA)).to.equal(true);
      expect(await this.bitmap.$get(0, keyB)).to.equal(true);
      expect(await this.bitmap.$get(0, keyC)).to.equal(false);
    });

    it('adds several consecutive keys', async function () {
      await this.bitmap.$set(0, keyA + 0n);
      await this.bitmap.$set(0, keyA + 1n);
      await this.bitmap.$set(0, keyA + 3n);
      expect(await this.bitmap.$get(0, keyA + 0n)).to.equal(true);
      expect(await this.bitmap.$get(0, keyA + 1n)).to.equal(true);
      expect(await this.bitmap.$get(0, keyA + 2n)).to.equal(false);
      expect(await this.bitmap.$get(0, keyA + 3n)).to.equal(true);
      expect(await this.bitmap.$get(0, keyA + 4n)).to.equal(false);
    });
  });

  describe('unset', function () {
    it('removes added keys', async function () {
      await this.bitmap.$set(0, keyA);
      await this.bitmap.$set(0, keyB);
      await this.bitmap.$unset(0, keyA);
      expect(await this.bitmap.$get(0, keyA)).to.equal(false);
      expect(await this.bitmap.$get(0, keyB)).to.equal(true);
      expect(await this.bitmap.$get(0, keyC)).to.equal(false);
    });

    it('removes consecutive added keys', async function () {
      await this.bitmap.$set(0, keyA + 0n);
      await this.bitmap.$set(0, keyA + 1n);
      await this.bitmap.$set(0, keyA + 3n);
      await this.bitmap.$unset(0, keyA + 1n);
      expect(await this.bitmap.$get(0, keyA + 0n)).to.equal(true);
      expect(await this.bitmap.$get(0, keyA + 1n)).to.equal(false);
      expect(await this.bitmap.$get(0, keyA + 2n)).to.equal(false);
      expect(await this.bitmap.$get(0, keyA + 3n)).to.equal(true);
      expect(await this.bitmap.$get(0, keyA + 4n)).to.equal(false);
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

      expect(await this.bitmap.$get(0, keyA)).to.equal(true);
      expect(await this.bitmap.$get(0, keyB)).to.equal(false);
      expect(await this.bitmap.$get(0, keyC)).to.equal(true);
    });
  });
});
