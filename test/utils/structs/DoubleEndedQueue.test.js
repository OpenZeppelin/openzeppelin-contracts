const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');

async function fixture() {
  const mock = await ethers.deployContract('$DoubleEndedQueue');

  /** Rebuild the content of the deque as a JS array. */
  const getContent = () =>
    mock.$length(0).then(length => Promise.all(Array.from({ length: Number(length) }, (_, i) => mock.$at(0, i))));

  return { mock, getContent };
}

describe('DoubleEndedQueue', function () {
  const coder = ethers.AbiCoder.defaultAbiCoder();
  const bytesA = coder.encode(['uint256'], [0xdeadbeef]);
  const bytesB = coder.encode(['uint256'], [0x0123456789]);
  const bytesC = coder.encode(['uint256'], [0x42424242]);
  const bytesD = coder.encode(['uint256'], [0x171717]);

  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('when empty', function () {
    it('getters', async function () {
      await expect(this.mock.$empty(0)).to.eventually.be.true;
      await expect(this.getContent()).to.eventually.have.ordered.members([]);
    });

    it('reverts on accesses', async function () {
      await expect(this.mock.$popBack(0)).to.be.revertedWithPanic(PANIC_CODES.POP_ON_EMPTY_ARRAY);
      await expect(this.mock.$popFront(0)).to.be.revertedWithPanic(PANIC_CODES.POP_ON_EMPTY_ARRAY);
      await expect(this.mock.$back(0)).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
      await expect(this.mock.$front(0)).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
    });

    it('try getters return false/zero on empty', async function () {
      await expect(this.mock.$tryFront(0)).to.eventually.deep.equal([false, ethers.ZeroHash]);
      await expect(this.mock.$tryBack(0)).to.eventually.deep.equal([false, ethers.ZeroHash]);
      await expect(this.mock.$tryAt(0, 0)).to.eventually.deep.equal([false, ethers.ZeroHash]);
    });

    it('try pops return false/zero on empty', async function () {
      await expect(this.mock.$tryPopFront(0)).to.emit(this.mock, 'return$tryPopFront').withArgs(false, ethers.ZeroHash);
      await expect(this.mock.$tryPopBack(0)).to.emit(this.mock, 'return$tryPopBack').withArgs(false, ethers.ZeroHash);
    });

    it('try pushes succeed on empty', async function () {
      await expect(this.mock.$tryPushFront(0, bytesA)).to.emit(this.mock, 'return$tryPushFront').withArgs(true);
      await expect(this.mock.$tryPushBack(0, bytesB)).to.emit(this.mock, 'return$tryPushBack').withArgs(true);

      await expect(this.getContent()).to.eventually.have.ordered.members([bytesA, bytesB]);
    });
  });

  describe('when not empty', function () {
    beforeEach(async function () {
      await this.mock.$pushBack(0, bytesB);
      await this.mock.$pushFront(0, bytesA);
      await this.mock.$pushBack(0, bytesC);
      this.content = [bytesA, bytesB, bytesC];
    });

    it('getters', async function () {
      await expect(this.mock.$empty(0)).to.eventually.be.false;
      await expect(this.mock.$length(0)).to.eventually.equal(this.content.length);
      await expect(this.mock.$front(0)).to.eventually.equal(this.content[0]);
      await expect(this.mock.$back(0)).to.eventually.equal(this.content[this.content.length - 1]);
      await expect(this.getContent()).to.eventually.have.ordered.members(this.content);
    });

    it('out of bounds access', async function () {
      await expect(this.mock.$at(0, this.content.length)).to.be.revertedWithPanic(
        PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS,
      );
    });

    it('try getters return true/value when not empty', async function () {
      await expect(this.mock.$tryFront(0)).to.eventually.deep.equal([true, this.content[0]]);
      await expect(this.mock.$tryBack(0)).to.eventually.deep.equal([true, this.content[this.content.length - 1]]);
      await expect(this.mock.$tryAt(0, 1)).to.eventually.deep.equal([true, this.content[1]]);
    });

    it('tryAt returns false/zero on out of bounds', async function () {
      await expect(this.mock.$tryAt(0, this.content.length)).to.eventually.deep.equal([false, ethers.ZeroHash]);
    });

    describe('push', function () {
      it('front', async function () {
        await this.mock.$pushFront(0, bytesD);
        this.content.unshift(bytesD); // add element at the beginning

        await expect(this.getContent()).to.eventually.have.ordered.members(this.content);
      });

      it('back', async function () {
        await this.mock.$pushBack(0, bytesD);
        this.content.push(bytesD); // add element at the end

        await expect(this.getContent()).to.eventually.have.ordered.members(this.content);
      });
    });

    describe('pop', function () {
      it('front', async function () {
        const value = this.content.shift(); // remove first element
        await expect(this.mock.$popFront(0)).to.emit(this.mock, 'return$popFront').withArgs(value);

        await expect(this.getContent()).to.eventually.have.ordered.members(this.content);
      });

      it('back', async function () {
        const value = this.content.pop(); // remove last element
        await expect(this.mock.$popBack(0)).to.emit(this.mock, 'return$popBack').withArgs(value);

        await expect(this.getContent()).to.eventually.have.ordered.members(this.content);
      });

      it('try front', async function () {
        const value = this.content.shift();
        await expect(this.mock.$tryPopFront(0)).to.emit(this.mock, 'return$tryPopFront').withArgs(true, value);

        await expect(this.getContent()).to.eventually.have.ordered.members(this.content);
      });

      it('try back', async function () {
        const value = this.content.pop();
        await expect(this.mock.$tryPopBack(0)).to.emit(this.mock, 'return$tryPopBack').withArgs(true, value);

        await expect(this.getContent()).to.eventually.have.ordered.members(this.content);
      });
    });

    it('clear', async function () {
      await this.mock.$clear(0);

      await expect(this.mock.$empty(0)).to.eventually.be.true;
      await expect(this.getContent()).to.eventually.have.ordered.members([]);
    });
  });
});
