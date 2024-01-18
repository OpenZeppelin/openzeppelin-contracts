const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const mock = await ethers.deployContract('$DoubleEndedQueue');

  /** Rebuild the content of the deque as a JS array. */
  const getContent = () =>
    mock.$length(0).then(length =>
      Promise.all(
        Array(Number(length))
          .fill()
          .map((_, i) => mock.$at(0, i)),
      ),
    );

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
      expect(await this.mock.$empty(0)).to.be.true;
      expect(await this.getContent()).to.have.ordered.members([]);
    });

    it('reverts on accesses', async function () {
      await expect(this.mock.$popBack(0)).to.be.revertedWithCustomError(this.mock, 'QueueEmpty');
      await expect(this.mock.$popFront(0)).to.be.revertedWithCustomError(this.mock, 'QueueEmpty');
      await expect(this.mock.$back(0)).to.be.revertedWithCustomError(this.mock, 'QueueEmpty');
      await expect(this.mock.$front(0)).to.be.revertedWithCustomError(this.mock, 'QueueEmpty');
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
      expect(await this.mock.$empty(0)).to.be.false;
      expect(await this.mock.$length(0)).to.equal(this.content.length);
      expect(await this.mock.$front(0)).to.equal(this.content[0]);
      expect(await this.mock.$back(0)).to.equal(this.content[this.content.length - 1]);
      expect(await this.getContent()).to.have.ordered.members(this.content);
    });

    it('out of bounds access', async function () {
      await expect(this.mock.$at(0, this.content.length)).to.be.revertedWithCustomError(this.mock, 'QueueOutOfBounds');
    });

    describe('push', function () {
      it('front', async function () {
        await this.mock.$pushFront(0, bytesD);
        this.content.unshift(bytesD); // add element at the beginning

        expect(await this.getContent()).to.have.ordered.members(this.content);
      });

      it('back', async function () {
        await this.mock.$pushBack(0, bytesD);
        this.content.push(bytesD); // add element at the end

        expect(await this.getContent()).to.have.ordered.members(this.content);
      });
    });

    describe('pop', function () {
      it('front', async function () {
        const value = this.content.shift(); // remove first element
        await expect(this.mock.$popFront(0)).to.emit(this.mock, 'return$popFront').withArgs(value);

        expect(await this.getContent()).to.have.ordered.members(this.content);
      });

      it('back', async function () {
        const value = this.content.pop(); // remove last element
        await expect(this.mock.$popBack(0)).to.emit(this.mock, 'return$popBack').withArgs(value);

        expect(await this.getContent()).to.have.ordered.members(this.content);
      });
    });

    it('clear', async function () {
      await this.mock.$clear(0);

      expect(await this.mock.$empty(0)).to.be.true;
      expect(await this.getContent()).to.have.ordered.members([]);
    });
  });
});
