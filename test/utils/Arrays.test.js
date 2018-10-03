const ArraysImpl = artifacts.require('ArraysImpl');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('Arrays', function () {
  context('Odd number of elements', function () {
    const ODD_ELEMENTS_ARRAY = range(128, 256);

    beforeEach(async function () {
      this.arrays = await ArraysImpl.new(ODD_ELEMENTS_ARRAY);
    });

    it('should return correct index for the basic case', async function () {
      (await this.arrays.findUpperBound(139)).should.be.bignumber.equal(11);
    });

    it('should return `index 0` for the first element', async function () {
      (await this.arrays.findUpperBound(128)).should.be.bignumber.equal(0);
    });

    it('should return `last index` for the last element', async function () {
      (await this.arrays.findUpperBound(256)).should.be.bignumber.equal(128);
    });

    it('should return `last index + 1` for the element over the upper boundary', async function () {
      (await this.arrays.findUpperBound(512)).should.be.bignumber.equal(129);
    });

    it('should return `index 0` for the element under the lower boundary', async function () {
      (await this.arrays.findUpperBound(64)).should.be.bignumber.equal(0);
    });
  });

  context('Even number of elements', function () {
    const EVEN_ELEMENTS_ARRAY = range(128, 255);

    beforeEach(async function () {
      this.arrays = await ArraysImpl.new(EVEN_ELEMENTS_ARRAY);
    });

    it('should return correct index for the basic case', async function () {
      (await this.arrays.findUpperBound(139)).should.be.bignumber.equal(11);
    });

    it('should return `index 0` for the first element', async function () {
      (await this.arrays.findUpperBound(128)).should.be.bignumber.equal(0);
    });

    it('should return `last index` for the last element', async function () {
      (await this.arrays.findUpperBound(255)).should.be.bignumber.equal(127);
    });

    it('should return `last index + 1` for the element over the upper boundary', async function () {
      (await this.arrays.findUpperBound(512)).should.be.bignumber.equal(128);
    });

    it('should return `index 0` for the element under the lower boundary', async function () {
      (await this.arrays.findUpperBound(64)).should.be.bignumber.equal(0);
    });
  });

  context('Array with gap', function () {
    const WITH_GAP_ARRAY = [...range(0, 64), ...range(128, 256)];

    beforeEach(async function () {
      this.arrays = await ArraysImpl.new(WITH_GAP_ARRAY);
    });

    it('should return `last index + 1` of first range for the element from the gap', async function () {
      (await this.arrays.findUpperBound(100)).should.be.bignumber.equal(65);
    });
  });

  function range (start, end) {
    return Array(end - start + 1).fill().map((_, idx) => start + idx);
  }
});
