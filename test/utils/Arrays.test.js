const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { randomArray, generators } = require('../helpers/random');
const { capitalize } = require('../../scripts/helpers');
const { TYPES_STORAGE, TYPES_MEMORY } = require('../../scripts/generate/templates/Arrays.opts');

// See https://en.cppreference.com/w/cpp/algorithm/ranges/lower_bound
const lowerBound = (array, value) => {
  const i = array.findIndex(element => value <= element);
  return i == -1 ? array.length : i;
};

// See https://en.cppreference.com/w/cpp/algorithm/upper_bound
// const upperBound = (array, value) => {
//   const i = array.findIndex(element => value < element);
//   return i == -1 ? array.length : i;
// };

const hasDuplicates = array => array.some((v, i) => array.indexOf(v) != i);

describe('Arrays', function () {
  describe('findUpperBound', function () {
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
          return { mock: await ethers.deployContract('Uint256ArraysMock', [array]) };
        };

        beforeEach(async function () {
          Object.assign(this, await loadFixture(fixture));
        });

        for (const [name, input] of Object.entries(tests)) {
          it(name, async function () {
            // findUpperBound does not support duplicated
            if (hasDuplicates(array)) this.skip();
            expect(await this.mock.findUpperBound(input)).to.equal(lowerBound(array, input));
          });
        }
      });
    }
  });

  describe('unsafeAccess', function () {
    const fixture = async () => {
      const env = Object.fromEntries(
        await Promise.all(
          TYPES_STORAGE.map(async type => {
            const elements = randomArray(generators[type], 10);

            return [
              type,
              {
                contract: await ethers.deployContract(`${capitalize(type)}ArraysMock`, [elements]),
                elements,
              },
            ];
          }),
        ),
      );

      return { env };
    };

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    describe('storage', function () {
      for (const name of TYPES_STORAGE) {
        it(name, async function () {
          const { contract, elements } = this.env[name];
          for (const i in elements) {
            expect(await contract.unsafeAccess(i)).to.equal(elements[i]);
          }
        });
      }
    });

    describe('memory', function () {
      for (const name of TYPES_MEMORY) {
        it(name, async function () {
          const { contract } = this.env[name];
          const elements = randomArray(generators[name], 10);
          for (const i in elements) {
            expect(await contract.unsafeMemoryAccess(elements, i)).to.equal(elements[i]);
          }
        });
      }
    });
  });
});
