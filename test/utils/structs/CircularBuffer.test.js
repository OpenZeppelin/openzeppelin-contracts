const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');

const { generators } = require('../../helpers/random');

const LENGTH = 4;

async function fixture() {
  const mock = await ethers.deployContract('$CircularBuffer');
  await mock.$setup(0, LENGTH);
  return { mock };
}

describe('CircularBuffer', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('starts empty', async function () {
    expect(await this.mock.$count(0)).to.equal(0n);
    expect(await this.mock.$size(0)).to.equal(LENGTH);
    await expect(this.mock.$last(0, 0)).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
  });

  it('push', async function () {
    const values = Array.from({ length: LENGTH + 3 }, generators.bytes32);

    for (const [i, value] of values.map((v, i) => [i, v])) {
      // push value
      await this.mock.$push(0, value);

      // view of the values
      const pushed = values.slice(0, i + 1);
      const stored = pushed.slice(-LENGTH);
      const dropped = pushed.slice(0, -LENGTH);

      // check count
      expect(await this.mock.$size(0)).to.equal(LENGTH);
      expect(await this.mock.$count(0)).to.equal(stored.length);

      // check last
      for (const i in stored) {
        expect(await this.mock.$last(0, i)).to.equal(stored.at(-i - 1));
      }

      // check included and non-included values
      for (const v of stored) {
        expect(await this.mock.$includes(0, v)).to.be.true;
      }
      for (const v of dropped) {
        expect(await this.mock.$includes(0, v)).to.be.false;
      }
    }
  });

  it('clear', async function () {
    await this.mock.$push(0, generators.bytes32());

    expect(await this.mock.$count(0)).to.equal(1n);
    expect(await this.mock.$size(0)).to.equal(LENGTH);
    await this.mock.$last(0, 0); // not revert

    await this.mock.$clear(0);

    expect(await this.mock.$count(0)).to.equal(0n);
    expect(await this.mock.$size(0)).to.equal(LENGTH);
    await expect(this.mock.$last(0, 0)).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
  });
});
