const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const findUpperBound = (array, value) => {
  const i = array.findIndex(x => x >= value);
  return i == -1 ? array.length : i;
};

const findLowerBound = (array, value) => {
  const i = array.findLastIndex(x => x <= value);
  return i == -1 ? array.length : i;
};

describe('Arrays', function () {
  describe('findUpperBound', function () {
    for (const [title, { array, tests }] of Object.entries({
      'Even number of elements': {
        array: [11n, 12n, 13n, 14n, 15n, 16n, 17n, 18n, 19n, 20n],
        tests: {
          'returns correct index for the basic case': 16n,
          'returns 0 for the first element': 11n,
          'returns index of the last element': 20n,
          'returns first index after last element if searched value is over the upper boundary': 32n,
          'returns 0 for the element under the lower boundary': 2n,
        },
      },
      'Odd number of elements': {
        array: [11n, 12n, 13n, 14n, 15n, 16n, 17n, 18n, 19n, 20n, 21n],
        tests: {
          'returns correct index for the basic case': 16n,
          'returns 0 for the first element': 11n,
          'returns index of the last element': 20n,
          'returns first index after last element if searched value is over the upper boundary': 32n,
          'returns 0 for the element under the lower boundary': 2n,
        },
      },
      'Array with gap': {
        array: [11n, 12n, 13n, 14n, 15n, 20n, 21n, 22n, 23n, 24n],
        tests: {
          'returns index of first element in next filled range': 17n,
        },
      },
      'Array with duplicated elements': {
        array: [0n, 10n, 10n, 10n, 10n, 10n, 10n, 10n, 20n],
        tests: {
          'returns index of first occurence': 10n,
        },
      },
      'Array with duplicated first element': {
        array: [10n, 10n, 10n, 10n, 10n, 10n, 10n, 20n],
        tests: {
          'returns index of first occurence': 10n,
        },
      },
      'Array with duplicated last element': {
        array: [0n, 10n, 10n, 10n, 10n, 10n, 10n, 10n],
        tests: {
          'returns index of first occurence': 10n,
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
            expect(await this.mock.findUpperBound(input)).to.be.equal(findUpperBound(array, input));
          });
        }
      });
    }
  });

  describe('findLowerBound', function () {
    for (const [title, { array, tests }] of Object.entries({
      'Even number of elements': {
        array: [11n, 12n, 13n, 14n, 15n, 16n, 17n, 18n, 19n, 20n],
        tests: {
          'returns correct index for the basic case': 16n,
          'returns 0 for the first element': 11n,
          'returns index of the last element': 20n,
          'returns index of last element if searched value is over the upper boundary': 32n,
          'returns length for the element under the lower boundary': 2n,
        },
      },
      'Odd number of elements': {
        array: [11n, 12n, 13n, 14n, 15n, 16n, 17n, 18n, 19n, 20n, 21n],
        tests: {
          'returns correct index for the basic case': 16n,
          'returns 0 for the first element': 11n,
          'returns index of the last element': 20n,
          'returns index of last element if searched value is over the upper boundary': 32n,
          'returns length for the element under the lower boundary': 2n,
        },
      },
      'Array with gap': {
        array: [11n, 12n, 13n, 14n, 15n, 20n, 21n, 22n, 23n, 24n],
        tests: {
          'returns index of first element in next filled range': 17n,
        },
      },
      'Array with duplicated elements': {
        array: [0n, 10n, 10n, 10n, 10n, 10n, 10n, 10n, 20n],
        tests: {
          'returns index of last occurence': 10n,
        },
      },
      'Array with duplicated first element': {
        array: [10n, 10n, 10n, 10n, 10n, 10n, 10n, 20n],
        tests: {
          'returns index of last occurence': 10n,
        },
      },
      'Array with duplicated last element': {
        array: [0n, 10n, 10n, 10n, 10n, 10n, 10n, 10n],
        tests: {
          'returns index of last occurence': 10n,
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
            expect(await this.mock.findLowerBound(input)).to.be.equal(findLowerBound(array, input));
          });
        }
      });
    }
  });

  describe('unsafeAccess', function () {
    for (const [name, { artifact, generator }] of Object.entries({
      address: {
        artifact: 'AddressArraysMock',
        generator: () => ethers.getAddress(ethers.hexlify(ethers.randomBytes(20))),
      },
      bytes32: {
        artifact: 'Bytes32ArraysMock',
        generator: () => ethers.hexlify(ethers.randomBytes(32)),
      },
      uint256: {
        artifact: 'Uint256ArraysMock',
        generator: () => ethers.toBigInt(ethers.randomBytes(32)),
      },
    })) {
      it(name, async function () {
        const elements = Array(10).fill().map(generator);
        const contract = await ethers.deployContract(artifact, [elements]);

        for (const i in elements) {
          expect(await contract.unsafeAccess(i)).to.be.equal(elements[i]);
        }
      });
    }
  });
});
