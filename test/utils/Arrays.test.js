const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { generators } = require('../helpers/random');
const { capitalize } = require('../../scripts/helpers');
const { TYPES } = require('../../scripts/generate/templates/Arrays.opts');

// See https://en.cppreference.com/w/cpp/algorithm/lower_bound
const lowerBound = (array, value) => {
  const i = array.findIndex(element => value <= element);
  return i == -1 ? array.length : i;
};

// See https://en.cppreference.com/w/cpp/algorithm/upper_bound
const upperBound = (array, value) => {
  const i = array.findIndex(element => value < element);
  return i == -1 ? array.length : i;
};

const bigintSign = x => (x > 0n ? 1 : x < 0n ? -1 : 0);
const comparator = (a, b) => bigintSign(ethers.toBigInt(a) - ethers.toBigInt(b));
const hasDuplicates = array => array.some((v, i) => array.indexOf(v) != i);

describe('Arrays', function () {
  const fixture = async () => {
    return { mock: await ethers.deployContract('$Arrays') };
  };

  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('search', function () {
    for (const [title, { array, tests }] of Object.entries({
      'Even number of elements': {
        array: [11n, 12n, 13n, 14n, 15n, 16n, 17n, 18n, 19n, 20n],
        tests: {
          'basic case': 16n,
          'first element': 11n,
          'last element': 20n,
          'searched value is over the upper boundary': 32n,
          'searched value is under the lower boundary': 2n,
        },
      },
      'Odd number of elements': {
        array: [11n, 12n, 13n, 14n, 15n, 16n, 17n, 18n, 19n, 20n, 21n],
        tests: {
          'basic case': 16n,
          'first element': 11n,
          'last element': 21n,
          'searched value is over the upper boundary': 32n,
          'searched value is under the lower boundary': 2n,
        },
      },
      'Array with gap': {
        array: [11n, 12n, 13n, 14n, 15n, 20n, 21n, 22n, 23n, 24n],
        tests: {
          'search value in gap': 17n,
        },
      },
      'Array with duplicated elements': {
        array: [0n, 10n, 10n, 10n, 10n, 10n, 10n, 10n, 20n],
        tests: {
          'search value is duplicated': 10n,
        },
      },
      'Array with duplicated first element': {
        array: [10n, 10n, 10n, 10n, 10n, 10n, 10n, 20n],
        tests: {
          'search value is duplicated first element': 10n,
        },
      },
      'Array with duplicated last element': {
        array: [0n, 10n, 10n, 10n, 10n, 10n, 10n, 10n],
        tests: {
          'search value is duplicated last element': 10n,
        },
      },
      'Empty array': {
        array: [],
        tests: {
          'always returns 0 for empty array': 10n,
        },
      },
    })) {
      describe(title, function () {
        const fixture = async () => {
          return { instance: await ethers.deployContract('Uint256ArraysMock', [array]) };
        };

        beforeEach(async function () {
          Object.assign(this, await loadFixture(fixture));
        });

        for (const [name, input] of Object.entries(tests)) {
          describe(name, function () {
            it('[deprecated] findUpperBound', async function () {
              // findUpperBound does not support duplicated
              if (hasDuplicates(array)) {
                await expect(this.instance.findUpperBound(input)).to.eventually.equal(upperBound(array, input) - 1);
              } else {
                await expect(this.instance.findUpperBound(input)).to.eventually.equal(lowerBound(array, input));
              }
            });

            it('lowerBound', async function () {
              await expect(this.instance.lowerBound(input)).to.eventually.equal(lowerBound(array, input));
              await expect(this.instance.lowerBoundMemory(array, input)).to.eventually.equal(lowerBound(array, input));
            });

            it('upperBound', async function () {
              await expect(this.instance.upperBound(input)).to.eventually.equal(upperBound(array, input));
              await expect(this.instance.upperBoundMemory(array, input)).to.eventually.equal(upperBound(array, input));
            });
          });
        }
      });
    }
  });

  for (const { name, isValueType } of TYPES) {
    const elements = Array.from({ length: 10 }, generators[name]);

    describe(name, function () {
      const fixture = async () => {
        return { instance: await ethers.deployContract(`${capitalize(name)}ArraysMock`, [elements]) };
      };

      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
      });

      if (isValueType) {
        describe('sort', function () {
          for (const length of [0, 1, 2, 8, 32, 128]) {
            describe(`${name}[] of length ${length}`, function () {
              beforeEach(async function () {
                this.array = Array.from({ length }, generators[name]);
              });

              afterEach(async function () {
                const expected = Array.from(this.array).sort(comparator);
                const reversed = Array.from(expected).reverse();
                await expect(this.instance.sort(this.array)).to.eventually.deep.equal(expected);
                await expect(this.instance.sortReverse(this.array)).to.eventually.deep.equal(reversed);
              });

              it('sort array', async function () {
                // nothing to do here, beforeEach and afterEach already take care of everything.
              });

              if (length > 1) {
                it('sort array for identical elements', async function () {
                  // duplicate the first value to all elements
                  this.array.fill(this.array.at(0));
                });

                it('sort already sorted array', async function () {
                  // pre-sort the elements
                  this.array.sort(comparator);
                });

                it('sort reversed array', async function () {
                  // pre-sort in reverse order
                  this.array.sort(comparator).reverse();
                });

                it('sort almost sorted array', async function () {
                  // pre-sort + rotate (move the last element to the front) for an almost sorted effect
                  this.array.sort(comparator);
                  this.array.unshift(this.array.pop());
                });
              }
            });
          }
        });

        describe('slice', function () {
          const testArray = Array.from({ length: 10 }, generators[name]);
          const sliceFragment = `$slice(${name}[] arr, uint256 start)`;
          const sliceRangeFragment = `$slice(${name}[] arr, uint256 start, uint256 end)`;

          it('slice from start to end', async function () {
            const start = 2;
            const end = 7;
            const expected = testArray.slice(start, end);
            await expect(this.mock[sliceRangeFragment](testArray, start, end)).to.eventually.deep.equal(expected);
          });

          it('slice from start to end of array', async function () {
            const start = 3;
            const expected = testArray.slice(start);
            await expect(this.mock[sliceFragment](testArray, start)).to.eventually.deep.equal(expected);
          });

          it('slice entire array', async function () {
            const expected = testArray.slice();
            await expect(this.mock[sliceFragment](testArray, 0)).to.eventually.deep.equal(expected);
            await expect(this.mock[sliceRangeFragment](testArray, 0, testArray.length)).to.eventually.deep.equal(
              expected,
            );
          });

          it('slice empty range', async function () {
            await expect(this.mock[sliceRangeFragment](testArray, 5, 5)).to.eventually.deep.equal([]);
            await expect(this.mock[sliceRangeFragment](testArray, 7, 3)).to.eventually.deep.equal([]);
          });

          it('slice with out of bounds indices', async function () {
            // start beyond array length
            await expect(this.mock[sliceFragment](testArray, testArray.length + 5)).to.eventually.deep.equal([]);

            // end beyond array length (should be truncated)
            const start = 5;
            const expected = testArray.slice(start);
            await expect(
              this.mock[sliceRangeFragment](testArray, start, testArray.length + 10),
            ).to.eventually.deep.equal(expected);
          });

          it('slice empty array', async function () {
            const emptyArray = [];
            await expect(this.mock[sliceFragment](emptyArray, 0)).to.eventually.deep.equal([]);
            await expect(this.mock[sliceFragment](emptyArray, 5)).to.eventually.deep.equal([]);
            await expect(this.mock[sliceRangeFragment](emptyArray, 0, 5)).to.eventually.deep.equal([]);
          });

          it('slice single element', async function () {
            const singleArray = [testArray[0]];
            await expect(this.mock[sliceFragment](singleArray, 0)).to.eventually.deep.equal(singleArray);
            await expect(this.mock[sliceFragment](singleArray, 1)).to.eventually.deep.equal([]);
            await expect(this.mock[sliceRangeFragment](singleArray, 0, 1)).to.eventually.deep.equal(singleArray);
          });
        });

        describe('splice', function () {
          const spliceFragment = `$splice(${name}[] arr, uint256 start)`;
          const spliceRangeFragment = `$splice(${name}[] arr, uint256 start, uint256 end)`;

          it('splice from start to end', async function () {
            const testArray = Array.from({ length: 10 }, generators[name]);
            const start = 2;
            const end = 7;
            const expected = testArray.slice(start, end);

            await expect(this.mock[spliceRangeFragment](testArray, start, end)).to.eventually.deep.equal(expected);
          });

          it('splice from start to end of array', async function () {
            const testArray = Array.from({ length: 10 }, generators[name]);
            const start = 3;
            const expected = testArray.slice(start);

            await expect(this.mock[spliceFragment](testArray, start)).to.eventually.deep.equal(expected);
          });

          it('splice entire array', async function () {
            const testArray = Array.from({ length: 10 }, generators[name]);
            const expected = testArray.slice();

            await expect(this.mock[spliceFragment](testArray, 0)).to.eventually.deep.equal(expected);
            await expect(this.mock[spliceRangeFragment](testArray, 0, testArray.length)).to.eventually.deep.equal(
              expected,
            );
          });

          it('splice empty range', async function () {
            const testArray = Array.from({ length: 10 }, generators[name]);

            await expect(this.mock[spliceRangeFragment](testArray, 5, 5)).to.eventually.deep.equal([]);
            await expect(this.mock[spliceRangeFragment](testArray, 7, 3)).to.eventually.deep.equal([]);
          });

          it('splice with out of bounds indices', async function () {
            const testArray = Array.from({ length: 10 }, generators[name]);

            // start beyond array length
            await expect(this.mock[spliceFragment](testArray, testArray.length + 5)).to.eventually.deep.equal([]);

            // end beyond array length (should be truncated)
            const start = 5;
            const expected = testArray.slice(start);
            await expect(
              this.mock[spliceRangeFragment](testArray, start, testArray.length + 10),
            ).to.eventually.deep.equal(expected);
          });

          it('splice empty array', async function () {
            const emptyArray = [];

            await expect(this.mock[spliceFragment](emptyArray, 0)).to.eventually.deep.equal([]);
            await expect(this.mock[spliceFragment](emptyArray, 5)).to.eventually.deep.equal([]);
            await expect(this.mock[spliceRangeFragment](emptyArray, 0, 5)).to.eventually.deep.equal([]);
          });

          it('splice single element', async function () {
            const singleArray = [Array.from({ length: 1 }, generators[name])[0]];

            await expect(this.mock[spliceFragment](singleArray, 0)).to.eventually.deep.equal(singleArray);
            await expect(this.mock[spliceFragment](singleArray, 1)).to.eventually.deep.equal([]);
            await expect(this.mock[spliceRangeFragment](singleArray, 0, 1)).to.eventually.deep.equal(singleArray);
          });
        });
      }

      describe('unsafeAccess', function () {
        describe('storage', function () {
          for (const i in elements) {
            it(`unsafeAccess within bounds #${i}`, async function () {
              await expect(this.instance.unsafeAccess(i)).to.eventually.equal(elements[i]);
            });
          }

          it('unsafeAccess outside bounds', async function () {
            await expect(this.instance.unsafeAccess(elements.length)).to.not.be.rejected;
          });

          it('unsafeSetLength changes the length or the array', async function () {
            const newLength = generators.uint256();

            await expect(this.instance.length()).to.eventually.equal(elements.length);
            await expect(this.instance.unsafeSetLength(newLength)).to.not.be.rejected;
            await expect(this.instance.length()).to.eventually.equal(newLength);
          });
        });

        describe('memory', function () {
          const fragment = `$unsafeMemoryAccess(${name}[] arr, uint256 pos)`;

          for (const i in elements) {
            it(`unsafeMemoryAccess within bounds #${i}`, async function () {
              await expect(this.mock[fragment](elements, i)).to.eventually.equal(elements[i]);
            });
          }

          it('unsafeMemoryAccess outside bounds', async function () {
            await expect(this.mock[fragment](elements, elements.length)).to.not.be.rejected;
          });

          it('unsafeMemoryAccess loop around', async function () {
            for (let i = 251n; i < 256n; ++i) {
              await expect(this.mock[fragment](elements, 2n ** i - 1n)).to.eventually.equal(
                isValueType ? BigInt(elements.length) : generators[name].zero,
              );
              await expect(this.mock[fragment](elements, 2n ** i + 0n)).to.eventually.equal(elements[0]);
              await expect(this.mock[fragment](elements, 2n ** i + 1n)).to.eventually.equal(elements[1]);
            }
          });
        });
      });
    });
  }
});
