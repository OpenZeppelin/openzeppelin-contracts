const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Bytes32VectorMock = artifacts.require('Bytes32VectorMock');

/**
 * Rebuild the content of the vector as a JS array.
 */
async function getContent (vector) {
  const length = await vector.length().then(bn => bn.toNumber());
  const values = await Promise.all(Array(length).fill().map((_, i) => vector.at(i)));
  return values;
}

contract('DoubleEndedQueue', function (accounts) {
  // Bytes32Vector
  describe('EnumerableVector', function () {
    const bytesA = '0xdeadbeef'.padEnd(66, '0');
    const bytesB = '0x0123456789'.padEnd(66, '0');
    const bytesC = '0x42424242'.padEnd(66, '0');
    const bytesD = '0x171717'.padEnd(66, '0');

    beforeEach(async function () {
      this.vector = await Bytes32VectorMock.new();
    });

    it('empty vector', async function () {
      expect(await this.vector.empty()).to.be.equal(true);
      expect(await getContent(this.vector)).to.have.ordered.members([]);
    });

    describe('with content', function () {
      beforeEach(async function () {
        await this.vector.pushBack(bytesB);
        await this.vector.pushFront(bytesA);
        await this.vector.pushBack(bytesC);
        this.content = [ bytesA, bytesB, bytesC ];
      });

      it('content is valid', async function () {
        expect(await this.vector.empty()).to.be.equal(false);
        expect(await this.vector.front()).to.be.equal(bytesA);
        expect(await this.vector.back()).to.be.equal(bytesC);
        expect(await getContent(this.vector)).to.have.ordered.members(this.content);
      });

      it('out of bound access', async function () {
        await expectRevert.unspecified(this.vector.at(10));
      });

      describe('push', function () {
        it('front', async function () {
          await this.vector.pushFront(bytesD);
          this.content.unshift(bytesD); // add element at the begining

          expect(await getContent(this.vector)).to.have.ordered.members(this.content);
        });

        it('back', async function () {
          await this.vector.pushBack(bytesD);
          this.content.push(bytesD); // add element at the end

          expect(await getContent(this.vector)).to.have.ordered.members(this.content);
        });
      });

      describe('pop', function () {
        it('front', async function () {
          expectEvent(await this.vector.popFront(), 'OperationResult', { value: bytesA });
          this.content.shift(); // remove first element

          expect(await getContent(this.vector)).to.have.ordered.members(this.content);
        });

        it('back', async function () {
          expectEvent(await this.vector.popBack(), 'OperationResult', { value: bytesC });
          this.content.pop(); // remove last element

          expect(await getContent(this.vector)).to.have.ordered.members(this.content);
        });
      });

      it('clear', async function () {
        await this.vector.clear();

        expect(await this.vector.empty()).to.be.equal(true);
        expect(await getContent(this.vector)).to.have.ordered.members([]);
      });
    });
  });
});
