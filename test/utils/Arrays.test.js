const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { randomArray, generators } = require('../helpers/random');

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

// By default, js "sort" cast to string and then sort in alphabetical order. Use this to sort numbers.
const compareNumbers = (a, b) => (a > b ? 1 : a < b ? -1 : 0);

const hasDuplicates = array => array.some((v, i) => array.indexOf(v) != i);

describe('Arrays', function () {
  const fixture = async () => {
    return { mock: await ethers.deployContract('$Arrays') };
  };

  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('sort', function () {
    for (const length of [0, 1, 2, 8, 32, 128]) {
      it(`sort array of length ${length}`, async function () {
        this.elements = randomArray(generators.uint256, length);
        this.expected = Array.from(this.elements).sort(compareNumbers);
      });

      if (length > 1) {
        it(`sort array of length ${length} (identical elements)`, async function () {
          this.elements = Array(length).fill(generators.uint256());
          this.expected = this.elements;
        });

        it(`sort array of length ${length} (already sorted)`, async function () {
          this.elements = randomArray(generators.uint256, length).sort(compareNumbers);
          this.expected = this.elements;
        });

        it(`sort array of length ${length} (sorted in reverse order)`, async function () {
          this.elements = randomArray(generators.uint256, length).sort(compareNumbers).reverse();
          this.expected = Array.from(this.elements).reverse();
        });

        it(`sort array of length ${length} (almost sorted)`, async function () {
          this.elements = randomArray(generators.uint256, length).sort(compareNumbers);
          this.expected = Array.from(this.elements);
          // rotate (move the last element to the front) for an almost sorted effect
          this.elements.unshift(this.elements.pop());
        });
      }
    }
    afterEach(async function () {
      expect(await this.mock.$sort(this.elements)).to.deep.equal(this.expected);
    });
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
                expect(await this.instance.findUpperBound(input)).to.equal(upperBound(array, input) - 1);
              } else {
                expect(await this.instance.findUpperBound(input)).to.equal(lowerBound(array, input));
              }
            });

            it('lowerBound', async function () {
              expect(await this.instance.lowerBound(input)).to.equal(lowerBound(array, input));
              expect(await this.instance.lowerBoundMemory(array, input)).to.equal(lowerBound(array, input));
            });

            it('upperBound', async function () {
              expect(await this.instance.upperBound(input)).to.equal(upperBound(array, input));
              expect(await this.instance.upperBoundMemory(array, input)).to.equal(upperBound(array, input));
            });
          });
        }
      });
    }
  });

  describe('unsafeAccess', function () {
    for (const [type, { artifact, elements }] of Object.entries({
      address: { artifact: 'AddressArraysMock', elements: randomArray(generators.address, 10) },
      bytes32: { artifact: 'Bytes32ArraysMock', elements: randomArray(generators.bytes32, 10) },
      uint256: { artifact: 'Uint256ArraysMock', elements: randomArray(generators.uint256, 10) },
    })) {
      describe(type, function () {
        describe('storage', function () {
          const fixture = async () => {
            return { instance: await ethers.deployContract(artifact, [elements]) };
          };

          beforeEach(async function () {
            Object.assign(this, await loadFixture(fixture));
          });

          for (const i in elements) {
            it(`unsafeAccess within bounds #${i}`, async function () {
              expect(await this.instance.unsafeAccess(i)).to.equal(elements[i]);
            });
          }

          it('unsafeAccess outside bounds', async function () {
            await expect(this.instance.unsafeAccess(elements.length)).to.not.be.rejected;
          });
        });

        describe('memory', function () {
          const fragment = `$unsafeMemoryAccess(${type}[] arr, uint256 pos)`;

          for (const i in elements) {
            it(`unsafeMemoryAccess within bounds #${i}`, async function () {
              expect(await this.mock[fragment](elements, i)).to.equal(elements[i]);
            });
          }

          it('unsafeMemoryAccess outside bounds', async function () {
            await expect(this.mock[fragment](elements, elements.length)).to.not.be.rejected;
          });
        });
      });
    }
  });
});
