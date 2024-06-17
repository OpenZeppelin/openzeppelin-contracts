const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');

async function fixture() {
  const mock = await ethers.deployContract('$Heap');
  return { mock };
}

describe('Heap', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('starts empty', async function () {
    await expect(this.mock.$top(0)).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
    expect(await this.mock.$length(0)).to.equal(0n);
  });

  it('pop from empty', async function () {
    await expect(this.mock.$pop(0)).to.be.revertedWithPanic(PANIC_CODES.POP_ON_EMPTY_ARRAY);
  });

  it('clear', async function () {
    await this.mock.$insert(0, 42n);
    expect(await this.mock.$length(0)).to.equal(1n);
    expect(await this.mock.$top(0)).to.equal(42n);

    await this.mock.$clear(0);
    expect(await this.mock.$length(0)).to.equal(0n);
    await expect(this.mock.$top(0)).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
  });

  it('support duplicated items', async function () {
    expect(await this.mock.$length(0)).to.equal(0n);

    // insert 5 times
    await this.mock.$insert(0, 42n);
    await this.mock.$insert(0, 42n);
    await this.mock.$insert(0, 42n);
    await this.mock.$insert(0, 42n);
    await this.mock.$insert(0, 42n);

    // pop 5 times
    await expect(this.mock.$pop(0)).to.emit(this.mock, 'return$pop').withArgs(42n);
    await expect(this.mock.$pop(0)).to.emit(this.mock, 'return$pop').withArgs(42n);
    await expect(this.mock.$pop(0)).to.emit(this.mock, 'return$pop').withArgs(42n);
    await expect(this.mock.$pop(0)).to.emit(this.mock, 'return$pop').withArgs(42n);
    await expect(this.mock.$pop(0)).to.emit(this.mock, 'return$pop').withArgs(42n);

    // popping a 6th time panics
    await expect(this.mock.$pop(0)).to.be.revertedWithPanic(PANIC_CODES.POP_ON_EMPTY_ARRAY);
  });

  it('insert and pop', async function () {
    const heap = [];
    for (const { op, value } of [
      { op: 'insert', value: 712 }, // [712]
      { op: 'insert', value: 20 }, // [20, 712]
      { op: 'insert', value: 4337 }, // [20, 712, 4437]
      { op: 'pop' }, // 20, [712, 4437]
      { op: 'insert', value: 1559 }, // [712, 1159, 4437]
      { op: 'insert', value: 155 }, // [155, 712, 1159, 4437]
      { op: 'insert', value: 7702 }, // [155, 712, 1159, 4437, 7702]
      { op: 'pop' }, // 155, [712, 1159, 4437, 7702]
      { op: 'insert', value: 721 }, // [712, 721, 1159, 4437, 7702]
      { op: 'pop' }, // 712, [721, 1159, 4437, 7702]
      { op: 'pop' }, // 721, [1159, 4437, 7702]
      { op: 'pop' }, // 1159, [4437, 7702]
      { op: 'pop' }, // 4437, [7702]
      { op: 'pop' }, // 7702, []
      { op: 'pop' }, // panic
    ]) {
      switch (op) {
        case 'insert':
          await this.mock.$insert(0, value);
          heap.push(value);
          heap.sort((a, b) => a - b);
          break;
        case 'pop':
          if (heap.length == 0) {
            await expect(this.mock.$pop(0)).to.be.revertedWithPanic(PANIC_CODES.POP_ON_EMPTY_ARRAY);
          } else {
            await expect(this.mock.$pop(0)).to.emit(this.mock, 'return$pop').withArgs(heap.shift());
          }
          break;
      }
      expect(await this.mock.$length(0)).to.equal(heap.length);
      if (heap.length == 0) {
        await expect(this.mock.$top(0)).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
      } else {
        expect(await this.mock.$top(0)).to.equal(heap[0]);
      }
    }
  });
});