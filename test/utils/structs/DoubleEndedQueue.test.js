const { expectEvent } = require('@openzeppelin/test-helpers');
const { expectRevertCustomError } = require('../../helpers/customError');

const DoubleEndedQueue = artifacts.require('$DoubleEndedQueue');

/** Rebuild the content of the deque as a JS array. */
const getContent = deque =>
  deque.$length(0).then(bn =>
    Promise.all(
      Array(bn.toNumber())
        .fill()
        .map((_, i) => deque.$at(0, i)),
    ),
  );

contract('DoubleEndedQueue', function () {
  const bytesA = '0xdeadbeef'.padEnd(66, '0');
  const bytesB = '0x0123456789'.padEnd(66, '0');
  const bytesC = '0x42424242'.padEnd(66, '0');
  const bytesD = '0x171717'.padEnd(66, '0');

  beforeEach(async function () {
    this.deque = await DoubleEndedQueue.new();
  });

  describe('when empty', function () {
    it('getters', async function () {
      expect(await this.deque.$empty(0)).to.be.equal(true);
      expect(await getContent(this.deque)).to.have.ordered.members([]);
    });

    it('reverts on accesses', async function () {
      await expectRevertCustomError(this.deque.$popBack(0), 'Empty()');
      await expectRevertCustomError(this.deque.$popFront(0), 'Empty()');
      await expectRevertCustomError(this.deque.$back(0), 'Empty()');
      await expectRevertCustomError(this.deque.$front(0), 'Empty()');
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
      expect(await this.deque.$length(0)).to.be.bignumber.equal(this.content.length.toString());
      expect(await this.deque.$front(0)).to.be.equal(this.content[0]);
      expect(await this.deque.$back(0)).to.be.equal(this.content[this.content.length - 1]);
      expect(await getContent(this.deque)).to.have.ordered.members(this.content);
    });

    it('out of bounds access', async function () {
      await expectRevertCustomError(this.deque.$at(0, this.content.length), 'OutOfBounds()');
    });

    describe('push', function () {
      it('front', async function () {
        await this.deque.$pushFront(0, bytesD);
        this.content.unshift(bytesD); // add element at the beginning

        expect(await getContent(this.deque)).to.have.ordered.members(this.content);
      });

      it('back', async function () {
        await this.deque.$pushBack(0, bytesD);
        this.content.push(bytesD); // add element at the end

        expect(await getContent(this.deque)).to.have.ordered.members(this.content);
      });
    });

    describe('pop', function () {
      it('front', async function () {
        const value = this.content.shift(); // remove first element
        expectEvent(await this.deque.$popFront(0), 'return$popFront', { value });

        expect(await getContent(this.deque)).to.have.ordered.members(this.content);
      });

      it('back', async function () {
        const value = this.content.pop(); // remove last element
        expectEvent(await this.deque.$popBack(0), 'return$popBack', { value });

        expect(await getContent(this.deque)).to.have.ordered.members(this.content);
      });
    });

    it('clear', async function () {
      await this.deque.$clear(0);

      expect(await this.deque.$empty(0)).to.be.equal(true);
      expect(await getContent(this.deque)).to.have.ordered.members([]);
    });
  });
});
