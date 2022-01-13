const { BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const BitMap = artifacts.require('BitMapMock');

contract('BitMap', function (accounts) {
  const keyA = new BN('7891');
  const keyB = new BN('451');
  const keyC = new BN('9592328');

  beforeEach(async function () {
    this.bitmap = await BitMap.new();
  });

  it('starts empty', async function () {
    expect(await this.bitmap.get(keyA)).to.equal(false);
    expect(await this.bitmap.get(keyB)).to.equal(false);
    expect(await this.bitmap.get(keyC)).to.equal(false);
  });

  describe('setTo', function () {
    it('set a key to true', async function () {
      await this.bitmap.setTo(keyA, true);
      expect(await this.bitmap.get(keyA)).to.equal(true);
      expect(await this.bitmap.get(keyB)).to.equal(false);
      expect(await this.bitmap.get(keyC)).to.equal(false);
    });

    it('set a key to false', async function () {
      await this.bitmap.setTo(keyA, true);
      await this.bitmap.setTo(keyA, false);
      expect(await this.bitmap.get(keyA)).to.equal(false);
      expect(await this.bitmap.get(keyB)).to.equal(false);
      expect(await this.bitmap.get(keyC)).to.equal(false);
    });

    it('set several consecutive keys', async function () {
      await this.bitmap.setTo(keyA.addn(0), true);
      await this.bitmap.setTo(keyA.addn(1), true);
      await this.bitmap.setTo(keyA.addn(2), true);
      await this.bitmap.setTo(keyA.addn(3), true);
      await this.bitmap.setTo(keyA.addn(4), true);
      await this.bitmap.setTo(keyA.addn(2), false);
      await this.bitmap.setTo(keyA.addn(4), false);
      expect(await this.bitmap.get(keyA.addn(0))).to.equal(true);
      expect(await this.bitmap.get(keyA.addn(1))).to.equal(true);
      expect(await this.bitmap.get(keyA.addn(2))).to.equal(false);
      expect(await this.bitmap.get(keyA.addn(3))).to.equal(true);
      expect(await this.bitmap.get(keyA.addn(4))).to.equal(false);
    });
  });

  describe('set', function () {
    it('adds a key', async function () {
      await this.bitmap.set(keyA);
      expect(await this.bitmap.get(keyA)).to.equal(true);
      expect(await this.bitmap.get(keyB)).to.equal(false);
      expect(await this.bitmap.get(keyC)).to.equal(false);
    });

    it('adds several keys', async function () {
      await this.bitmap.set(keyA);
      await this.bitmap.set(keyB);
      expect(await this.bitmap.get(keyA)).to.equal(true);
      expect(await this.bitmap.get(keyB)).to.equal(true);
      expect(await this.bitmap.get(keyC)).to.equal(false);
    });

    it('adds several consecutive keys', async function () {
      await this.bitmap.set(keyA.addn(0));
      await this.bitmap.set(keyA.addn(1));
      await this.bitmap.set(keyA.addn(3));
      expect(await this.bitmap.get(keyA.addn(0))).to.equal(true);
      expect(await this.bitmap.get(keyA.addn(1))).to.equal(true);
      expect(await this.bitmap.get(keyA.addn(2))).to.equal(false);
      expect(await this.bitmap.get(keyA.addn(3))).to.equal(true);
      expect(await this.bitmap.get(keyA.addn(4))).to.equal(false);
    });
  });

  describe('unset', function () {
    it('removes added keys', async function () {
      await this.bitmap.set(keyA);
      await this.bitmap.set(keyB);
      await this.bitmap.unset(keyA);
      expect(await this.bitmap.get(keyA)).to.equal(false);
      expect(await this.bitmap.get(keyB)).to.equal(true);
      expect(await this.bitmap.get(keyC)).to.equal(false);
    });

    it('removes consecutive added keys', async function () {
      await this.bitmap.set(keyA.addn(0));
      await this.bitmap.set(keyA.addn(1));
      await this.bitmap.set(keyA.addn(3));
      await this.bitmap.unset(keyA.addn(1));
      expect(await this.bitmap.get(keyA.addn(0))).to.equal(true);
      expect(await this.bitmap.get(keyA.addn(1))).to.equal(false);
      expect(await this.bitmap.get(keyA.addn(2))).to.equal(false);
      expect(await this.bitmap.get(keyA.addn(3))).to.equal(true);
      expect(await this.bitmap.get(keyA.addn(4))).to.equal(false);
    });

    it('adds and removes multiple keys', async function () {
      // []

      await this.bitmap.set(keyA);
      await this.bitmap.set(keyC);

      // [A, C]

      await this.bitmap.unset(keyA);
      await this.bitmap.unset(keyB);

      // [C]

      await this.bitmap.set(keyB);

      // [C, B]

      await this.bitmap.set(keyA);
      await this.bitmap.unset(keyC);

      // [A, B]

      await this.bitmap.set(keyA);
      await this.bitmap.set(keyB);

      // [A, B]

      await this.bitmap.set(keyC);
      await this.bitmap.unset(keyA);

      // [B, C]

      await this.bitmap.set(keyA);
      await this.bitmap.unset(keyB);

      // [A, C]

      expect(await this.bitmap.get(keyA)).to.equal(true);
      expect(await this.bitmap.get(keyB)).to.equal(false);
      expect(await this.bitmap.get(keyC)).to.equal(true);
    });
  });
});
