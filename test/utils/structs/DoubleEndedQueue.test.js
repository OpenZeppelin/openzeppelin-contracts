const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const deque = await ethers.deployContract('$DoubleEndedQueue');

  /** Rebuild the content of the deque as a JS array. */
  const getContent = () =>
    deque.$length(0).then(length =>
      Promise.all(
        Array(Number(length))
          .fill()
          .map((_, i) => deque.$at(0, i)),
      ),
    );

  return { deque, getContent };
}

describe('DoubleEndedQueue', function () {
  const bytesA = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [0xdeadbeef]);
  const bytesB = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [0x0123456789]);
  const bytesC = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [0x42424242]);
  const bytesD = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [0x171717]);

  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('when empty', function () {
    it('getters', async function () {
      expect(await this.deque.$empty(0)).to.be.equal(true);
      expect(await this.getContent()).to.have.ordered.members([]);
    });

    it('reverts on accesses', async function () {
      await expect(this.deque.$popBack(0), 'QueueEmpty').to.be.reverted;
      await expect(this.deque.$popFront(0), 'QueueEmpty').to.be.reverted;
      await expect(this.deque.$back(0), 'QueueEmpty').to.be.reverted;
      await expect(this.deque.$front(0), 'QueueEmpty').to.be.reverted;
    });
  });

  describe('when not empty', function () {
    beforeEach(async function () {
      await this.deque.$pushBack(0, bytesB);
      await this.deque.$pushFront(0, bytesA);
      await this.deque.$pushBack(0, bytesC);
      this.content = [bytesA, bytesB, bytesC];
    });

    it('getters', async function () {
      expect(await this.deque.$empty(0)).to.be.equal(false);
      expect(await this.deque.$length(0)).to.be.equal(this.content.length);
      expect(await this.deque.$front(0)).to.be.equal(this.content[0]);
      expect(await this.deque.$back(0)).to.be.equal(this.content[this.content.length - 1]);
      expect(await this.getContent()).to.have.ordered.members(this.content);
    });

    it('out of bounds access', async function () {
      await expect(this.deque.$at(0, this.content.length), 'QueueOutOfBounds').to.be.reverted;
    });

    describe('push', function () {
      it('front', async function () {
        await this.deque.$pushFront(0, bytesD);
        this.content.unshift(bytesD); // add element at the beginning

        expect(await this.getContent()).to.have.ordered.members(this.content);
      });

      it('back', async function () {
        await this.deque.$pushBack(0, bytesD);
        this.content.push(bytesD); // add element at the end

        expect(await this.getContent()).to.have.ordered.members(this.content);
      });
    });

    describe('pop', function () {
      it('front', async function () {
        const value = this.content.shift(); // remove first element
        await expect(this.deque.$popFront(0)).to.emit(this.deque, 'return$popFront').withArgs(value);

        expect(await this.getContent()).to.have.ordered.members(this.content);
      });

      it('back', async function () {
        const value = this.content.pop(); // remove last element
        await expect(this.deque.$popBack(0)).to.emit(this.deque, 'return$popBack').withArgs(value);

        expect(await this.getContent()).to.have.ordered.members(this.content);
      });
    });

    it('clear', async function () {
      await this.deque.$clear(0);

      expect(await this.deque.$empty(0)).to.be.equal(true);
      expect(await this.getContent()).to.have.ordered.members([]);
    });
  });
});
