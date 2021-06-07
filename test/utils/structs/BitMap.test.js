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
