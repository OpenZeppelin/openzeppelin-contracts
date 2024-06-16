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

    // poping a 6th time panics
    await expect(this.mock.$pop(0)).to.be.revertedWithPanic(PANIC_CODES.POP_ON_EMPTY_ARRAY);
  });

  it('insert and pop', async function () {
    expect(await this.mock.$length(0)).to.equal(0n);
    await expect(this.mock.$top(0)).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);

    await this.mock.$insert(0, 712n); // 712

    expect(await this.mock.$length(0)).to.equal(1n);
    expect(await this.mock.$top(0)).to.equal(712n);

    await this.mock.$insert(0, 20n); // 20, 712

    expect(await this.mock.$length(0)).to.equal(2n);
    expect(await this.mock.$top(0)).to.equal(20n);

    await this.mock.$insert(0, 4337n); // 20, 712, 4337

    expect(await this.mock.$length(0)).to.equal(3n);
    expect(await this.mock.$top(0)).to.equal(20n);

    await expect(this.mock.$pop(0)).to.emit(this.mock, 'return$pop').withArgs(20n); // 712, 4337

    expect(await this.mock.$length(0)).to.equal(2n);
    expect(await this.mock.$top(0)).to.equal(712n);

    await this.mock.$insert(0, 1559n); // 712, 1559, 4337

    expect(await this.mock.$length(0)).to.equal(3n);
    expect(await this.mock.$top(0)).to.equal(712n);

    await this.mock.$insert(0, 155n); // 155, 712, 1559, 4337

    expect(await this.mock.$length(0)).to.equal(4n);
    expect(await this.mock.$top(0)).to.equal(155n);

    await this.mock.$insert(0, 7702n); // 155, 712, 1559, 4337, 7702

    expect(await this.mock.$length(0)).to.equal(5n);
    expect(await this.mock.$top(0)).to.equal(155n);

    await expect(this.mock.$pop(0)).to.emit(this.mock, 'return$pop').withArgs(155n); // 712, 1559, 4337, 7702

    expect(await this.mock.$length(0)).to.equal(4n);
    expect(await this.mock.$top(0)).to.equal(712n);

    await this.mock.$insert(0, 721n); // 712, 721, 1559, 4337, 7702

    expect(await this.mock.$length(0)).to.equal(5n);
    expect(await this.mock.$top(0)).to.equal(712n);

    await expect(this.mock.$pop(0)).to.emit(this.mock, 'return$pop').withArgs(712n); // 721, 1559, 4337, 7702

    expect(await this.mock.$length(0)).to.equal(4n);
    expect(await this.mock.$top(0)).to.equal(721n);

    await expect(this.mock.$pop(0)).to.emit(this.mock, 'return$pop').withArgs(721n); // 1559, 4337, 7702

    expect(await this.mock.$length(0)).to.equal(3n);
    expect(await this.mock.$top(0)).to.equal(1559n);

    await expect(this.mock.$pop(0)).to.emit(this.mock, 'return$pop').withArgs(1559n); // 4337, 7702

    expect(await this.mock.$length(0)).to.equal(2n);
    expect(await this.mock.$top(0)).to.equal(4337n);

    await expect(this.mock.$pop(0)).to.emit(this.mock, 'return$pop').withArgs(4337n); // 7702

    expect(await this.mock.$length(0)).to.equal(1n);
    expect(await this.mock.$top(0)).to.equal(7702n);

    await expect(this.mock.$pop(0)).to.emit(this.mock, 'return$pop').withArgs(7702n); // <empty>

    expect(await this.mock.$length(0)).to.equal(0n);
    await expect(this.mock.$top(0)).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
  });
});
