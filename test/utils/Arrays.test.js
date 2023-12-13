const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { randomArray, generators } = require('../helpers/random');

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
            expect(await this.mock.findUpperBound(input)).to.be.equal(lowerBound(array, input));
          });
        }
      });
    }
  });

  describe('unsafeAccess', function () {
    const contractCases = {
      address: { artifact: 'AddressArraysMock', elements: randomArray(generators.address, 10) },
      bytes32: { artifact: 'Bytes32ArraysMock', elements: randomArray(generators.bytes32, 10) },
      uint256: { artifact: 'Uint256ArraysMock', elements: randomArray(generators.uint256, 10) },
    };

    const fixture = async () => {
      const contracts = {};
      for (const [name, { artifact, elements }] of Object.entries(contractCases)) {
        contracts[name] = await ethers.deployContract(artifact, [elements]);
      }
      return { contracts };
    };

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    for (const [name, { elements }] of Object.entries(contractCases)) {
      it(name, async function () {
        for (const i in elements) {
          expect(await this.contracts[name].unsafeAccess(i)).to.be.equal(elements[i]);
        }
      });
    }
  });
});
