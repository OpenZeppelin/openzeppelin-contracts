require('@openzeppelin/test-helpers');

const { expect } = require('chai');
const { config } = require('hardhat');

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

  describe.only('sort', function () {
    let arraysImpl;

    before(async function () {
      arraysImpl = await ArraysImpl.new([]);
    });

    async function testSort (array) {
      const { sorted, gasUsed } = (await arraysImpl.sort(array));
      const sortedNum = sorted.map(val => val.toNumber());
      array.sort((a, b) => a - b);
      expect(sortedNum).to.deep.equal(array, 'Invalid sorting result');
      // Gas reporting is enabled, print gas usage.
      // `hardhat-gas-reporter` can't be relied on here because:
      // - it adds up all the calls without breaking down into specific tests
      // - it measures the whole TXs and not just the library function calls
      if (config.mocha.reporter) console.log('Gas used:', gasUsed.toString());
    }

    function arrayOf (length, generator) {
      return Array.from(Array(length), generator);
    }

    const randomItems = () => Math.floor(Math.random() * 1000);
    const sameItems = () => 1;
    const sortedItems = (_, idx) => idx;
    const reverseSortedItems = (_, idx) => 1000 - idx;

    it('accepts zero length arrays', async function () {
      await testSort([]);
    });

    it('accepts one length arrays', async function () {
      await testSort([1]);
    });

    it('handles sorted data', async function () {
      await testSort([1, 2, 3]);
    });

    it('handles reverse sorted data', async function () {
      await testSort([3, 2, 1]);
    });

    it('handles scrambled data', async function () {
      await testSort([2, 1, 3]);
    });

    it('handles 10 random items', async function () {
      await testSort(arrayOf(10, randomItems));
    });

    it('handles 10 same items', async function () {
      await testSort(arrayOf(10, sameItems));
    });

    it('handles 10 sorted items', async function () {
      await testSort(arrayOf(10, sortedItems));
    });

    it('handles 10 reverse sorted items', async function () {
      await testSort(arrayOf(10, reverseSortedItems));
    });

    it('handles 100 random items', async function () {
      await testSort(arrayOf(100, randomItems));
    });

    it('handles 100 same items', async function () {
      await testSort(arrayOf(100, sameItems));
    });

    it('handles 100 sorted items', async function () {
      await testSort(arrayOf(100, sortedItems));
    });

    it('handles 100 reverse sorted items', async function () {
      await testSort(arrayOf(100, reverseSortedItems));
    });
  });
});
