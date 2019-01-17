require('openzeppelin-test-helpers');

const ArraysImpl = artifacts.require('ArraysImpl');

contract('Arrays', function () {
  context('Even number of elements', function () {
    const EVEN_ELEMENTS_ARRAY = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

    beforeEach(async function () {
      this.arrays = await ArraysImpl.new(EVEN_ELEMENTS_ARRAY);
    });

    it('should return correct index for the basic case', async function () {
      (await this.arrays.findUpperBound(16)).should.be.bignumber.equal('5');
    });

    it('should return 0 for the first element', async function () {
      (await this.arrays.findUpperBound(11)).should.be.bignumber.equal('0');
    });

    it('should return index of the last element', async function () {
      (await this.arrays.findUpperBound(20)).should.be.bignumber.equal('9');
    });

    it('should return first index after last element if searched value is over the upper boundary', async function () {
      (await this.arrays.findUpperBound(32)).should.be.bignumber.equal('10');
    });

    it('should return 0 for the element under the lower boundary', async function () {
      (await this.arrays.findUpperBound(2)).should.be.bignumber.equal('0');
    });
  });

  context('Odd number of elements', function () {
    const ODD_ELEMENTS_ARRAY = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

    beforeEach(async function () {
      this.arrays = await ArraysImpl.new(ODD_ELEMENTS_ARRAY);
    });

    it('should return correct index for the basic case', async function () {
      (await this.arrays.findUpperBound(16)).should.be.bignumber.equal('5');
    });

    it('should return 0 for the first element', async function () {
      (await this.arrays.findUpperBound(11)).should.be.bignumber.equal('0');
    });

    it('should return index of the last element', async function () {
      (await this.arrays.findUpperBound(21)).should.be.bignumber.equal('10');
    });

    it('should return first index after last element if searched value is over the upper boundary', async function () {
      (await this.arrays.findUpperBound(32)).should.be.bignumber.equal('11');
    });

    it('should return 0 for the element under the lower boundary', async function () {
      (await this.arrays.findUpperBound(2)).should.be.bignumber.equal('0');
    });
  });

  context('Array with gap', function () {
    const WITH_GAP_ARRAY = [11, 12, 13, 14, 15, 20, 21, 22, 23, 24];

    beforeEach(async function () {
      this.arrays = await ArraysImpl.new(WITH_GAP_ARRAY);
    });

    it('should return index of first element in next filled range', async function () {
      (await this.arrays.findUpperBound(17)).should.be.bignumber.equal('5');
    });
  });

  context('Empty array', function () {
    beforeEach(async function () {
      this.arrays = await ArraysImpl.new([]);
    });

    it('should always return 0 for empty array', async function () {
      (await this.arrays.findUpperBound(10)).should.be.bignumber.equal('0');
    });
  });
});
