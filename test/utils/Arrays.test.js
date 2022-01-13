require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ArraysImpl = artifacts.require('ArraysImpl');

contract('Arrays', function (accounts) {
  describe('findUpperBound', function () {
    context('Even number of elements', function () {
      const EVEN_ELEMENTS_ARRAY = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

      beforeEach(async function () {
        this.arrays = await ArraysImpl.new(EVEN_ELEMENTS_ARRAY);
      });

      it('returns correct index for the basic case', async function () {
        expect(await this.arrays.findUpperBound(16)).to.be.bignumber.equal('5');
      });

      it('returns 0 for the first element', async function () {
        expect(await this.arrays.findUpperBound(11)).to.be.bignumber.equal('0');
      });

      it('returns index of the last element', async function () {
        expect(await this.arrays.findUpperBound(20)).to.be.bignumber.equal('9');
      });

      it('returns first index after last element if searched value is over the upper boundary', async function () {
        expect(await this.arrays.findUpperBound(32)).to.be.bignumber.equal('10');
      });

      it('returns 0 for the element under the lower boundary', async function () {
        expect(await this.arrays.findUpperBound(2)).to.be.bignumber.equal('0');
      });
    });

    context('Odd number of elements', function () {
      const ODD_ELEMENTS_ARRAY = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

      beforeEach(async function () {
        this.arrays = await ArraysImpl.new(ODD_ELEMENTS_ARRAY);
      });

      it('returns correct index for the basic case', async function () {
        expect(await this.arrays.findUpperBound(16)).to.be.bignumber.equal('5');
      });

      it('returns 0 for the first element', async function () {
        expect(await this.arrays.findUpperBound(11)).to.be.bignumber.equal('0');
      });

      it('returns index of the last element', async function () {
        expect(await this.arrays.findUpperBound(21)).to.be.bignumber.equal('10');
      });

      it('returns first index after last element if searched value is over the upper boundary', async function () {
        expect(await this.arrays.findUpperBound(32)).to.be.bignumber.equal('11');
      });

      it('returns 0 for the element under the lower boundary', async function () {
        expect(await this.arrays.findUpperBound(2)).to.be.bignumber.equal('0');
      });
    });

    context('Array with gap', function () {
      const WITH_GAP_ARRAY = [11, 12, 13, 14, 15, 20, 21, 22, 23, 24];

      beforeEach(async function () {
        this.arrays = await ArraysImpl.new(WITH_GAP_ARRAY);
      });

      it('returns index of first element in next filled range', async function () {
        expect(await this.arrays.findUpperBound(17)).to.be.bignumber.equal('5');
      });
    });

    context('Empty array', function () {
      beforeEach(async function () {
        this.arrays = await ArraysImpl.new([]);
      });

      it('always returns 0 for empty array', async function () {
        expect(await this.arrays.findUpperBound(10)).to.be.bignumber.equal('0');
      });
    });
  });
});
