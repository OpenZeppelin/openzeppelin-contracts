const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { mapValues } = require('../../helpers/iterate');
const { generators } = require('../../helpers/random');
const { TYPES, formatType } = require('../../../scripts/generate/templates/EnumerableMap.opts');

const { shouldBehaveLikeMap } = require('./EnumerableMap.behavior');

// Add Bytes32ToBytes32Map that must be tested but is not part of the generated types.
TYPES.unshift(formatType('bytes32', 'bytes32'));

async function fixture() {
  const mock = await ethers.deployContract('$EnumerableMap');
  const env = Object.fromEntries(
    TYPES.map(({ name, keyType, valueType }) => [
      name,
      {
        keyType,
        keys: Array.from({ length: 3 }, generators[keyType]),
        values: Array.from({ length: 3 }, generators[valueType]),
        zeroValue: generators[valueType].zero,
        methods: mapValues(
          {
            set: `$set(uint256,${keyType},${valueType})`,
            get: `$get_EnumerableMap_${name}(uint256,${keyType})`,
            tryGet: `$tryGet_EnumerableMap_${name}(uint256,${keyType})`,
            remove: `$remove_EnumerableMap_${name}(uint256,${keyType})`,
            length: `$length_EnumerableMap_${name}(uint256)`,
            at: `$at_EnumerableMap_${name}(uint256,uint256)`,
            contains: `$contains_EnumerableMap_${name}(uint256,${keyType})`,
            keys: `$keys_EnumerableMap_${name}(uint256)`,
          },
          fnSig =>
            (...args) =>
              mock.getFunction(fnSig)(0, ...args),
        ),
        events: {
          setReturn: `return$set_EnumerableMap_${name}_${keyType}_${valueType}`,
          removeReturn: `return$remove_EnumerableMap_${name}_${keyType}`,
        },
      },
    ]),
  );

  return { mock, env };
}

describe('EnumerableMap', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  for (const { name } of TYPES) {
    describe(name, function () {
      beforeEach(async function () {
        Object.assign(this, this.env[name]);
        [this.keyA, this.keyB, this.keyC] = this.keys;
        [this.valueA, this.valueB, this.valueC] = this.values;
      });

      shouldBehaveLikeMap();
    });
  }
});
