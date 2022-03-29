const { expectEvent } = require('@openzeppelin/test-helpers');
const { expectRevertCustomError } = require('../../helpers/customError');

const Bytes32DequeMock = artifacts.require('Bytes32DequeMock');

/** Rebuild the content of the deque as a JS array. */
async function getContent (deque) {
  const length = await deque.length().then(bn => bn.toNumber());
  const values = await Promise.all(Array(length).fill().map((_, i) => deque.at(i)));
  return values;
}

contract('DoubleEndedQueue', function (accounts) {
  const bytesA = '0xdeadbeef'.padEnd(66, '0');
  const bytesB = '0x0123456789'.padEnd(66, '0');
  const bytesC = '0x42424242'.padEnd(66, '0');
  const bytesD = '0x171717'.padEnd(66, '0');

  beforeEach(async function () {
    this.deque = await Bytes32DequeMock.new();
  });

  describe('when empty', function () {
    it('getters', async function () {
      expect(await this.deque.empty()).to.be.equal(true);
      expect(await getContent(this.deque)).to.have.ordered.members([]);
    });

    it('reverts on accesses', async function () {
      await expectRevertCustomError(this.deque.popBack(), 'Empty()');
      await expectRevertCustomError(this.deque.popFront(), 'Empty()');
      await expectRevertCustomError(this.deque.back(), 'Empty()');
      await expectRevertCustomError(this.deque.front(), 'Empty()');
    });
  });

  describe('when not empty', function () {
    beforeEach(async function () {
      await this.deque.pushBack(bytesB);
      await this.deque.pushFront(bytesA);
      await this.deque.pushBack(bytesC);
      this.content = [ bytesA, bytesB, bytesC ];
    });

    it('getters', async function () {
      expect(await this.deque.empty()).to.be.equal(false);
      expect(await this.deque.length()).to.be.bignumber.equal(this.content.length.toString());
      expect(await this.deque.front()).to.be.equal(this.content[0]);
      expect(await this.deque.back()).to.be.equal(this.content[this.content.length - 1]);
      expect(await getContent(this.deque)).to.have.ordered.members(this.content);
    });

    it('out of bounds access', async function () {
      await expectRevertCustomError(this.deque.at(this.content.length), 'OutOfBounds()');
    });

    describe('push', function () {
      it('front', async function () {
        await this.deque.pushFront(bytesD);
        this.content.unshift(bytesD); // add element at the beginning

        expect(await getContent(this.deque)).to.have.ordered.members(this.content);
      });

      it('back', async function () {
        await this.deque.pushBack(bytesD);
        this.content.push(bytesD); // add element at the end

        expect(await getContent(this.deque)).to.have.ordered.members(this.content);
      });
    });

    describe('pop', function () {
      it('front', async function () {
        const value = this.content.shift(); // remove first element
        expectEvent(await this.deque.popFront(), 'OperationResult', { value });

        expect(await getContent(this.deque)).to.have.ordered.members(this.content);
      });

      it('back', async function () {
        const value = this.content.pop(); // remove last element
        expectEvent(await this.deque.popBack(), 'OperationResult', { value });

        expect(await getContent(this.deque)).to.have.ordered.members(this.content);
      });
    });

    it('clear', async function () {
      await this.deque.clear();

      expect(await this.deque.empty()).to.be.equal(true);
      expect(await getContent(this.deque)).to.have.ordered.members([]);
    });
  });
});
