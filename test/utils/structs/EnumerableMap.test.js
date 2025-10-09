const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { mapValues } = require('../../helpers/iterate');
const { generators } = require('../../helpers/random');
const { MAP_TYPES, typeDescr, toMapTypeDescr } = require('../../../scripts/generate/templates/Enumerable.opts');

const { shouldBehaveLikeMap } = require('./EnumerableMap.behavior');

// Add Bytes32ToBytes32Map that must be tested but is not part of the generated types.
MAP_TYPES.unshift(toMapTypeDescr({ key: typeDescr({ type: 'bytes32' }), value: typeDescr({ type: 'bytes32' }) }));

async function fixture() {
  const mock = await ethers.deployContract('$EnumerableMap');

  const env = Object.fromEntries(
    MAP_TYPES.map(({ name, key, value }) => [
      name,
      {
        key,
        value,
        keys: Array.from({ length: 3 }, generators[key.type]),
        values: Array.from({ length: 3 }, generators[value.type]),
        zeroValue: generators[value.type].zero,
        methods: mapValues(
          MAP_TYPES.filter(map => map.key.name == key.name).length == 1
            ? {
                set: `$set(uint256,${key.type},${value.type})`,
                get: `$get(uint256,${key.type})`,
                tryGet: `$tryGet(uint256,${key.type})`,
                remove: `$remove(uint256,${key.type})`,
                contains: `$contains(uint256,${key.type})`,
                clear: `$clear_EnumerableMap_${name}(uint256)`,
                length: `$length_EnumerableMap_${name}(uint256)`,
                at: `$at_EnumerableMap_${name}(uint256,uint256)`,
                keys: `$keys_EnumerableMap_${name}(uint256)`,
                keysPage: `$keys_EnumerableMap_${name}(uint256,uint256,uint256)`,
              }
            : {
                set: `$set(uint256,${key.type},${value.type})`,
                get: `$get_EnumerableMap_${name}(uint256,${key.type})`,
                tryGet: `$tryGet_EnumerableMap_${name}(uint256,${key.type})`,
                remove: `$remove_EnumerableMap_${name}(uint256,${key.type})`,
                contains: `$contains_EnumerableMap_${name}(uint256,${key.type})`,
                clear: `$clear_EnumerableMap_${name}(uint256)`,
                length: `$length_EnumerableMap_${name}(uint256)`,
                at: `$at_EnumerableMap_${name}(uint256,uint256)`,
                keys: `$keys_EnumerableMap_${name}(uint256)`,
                keysPage: `$keys_EnumerableMap_${name}(uint256,uint256,uint256)`,
              },
          fnSig =>
            (...args) =>
              mock.getFunction(fnSig)(0, ...args),
        ),
        events: {
          setReturn: `return$set_EnumerableMap_${name}_${key.type}_${value.type}`,
          removeReturn: `return$remove_EnumerableMap_${name}_${key.type}`,
        },
        error: key.memory || value.memory ? `EnumerableMapNonexistent${key.name}Key` : `EnumerableMapNonexistentKey`,
      },
    ]),
  );

  return { mock, env };
}

describe('EnumerableMap', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  for (const { name, key, value } of MAP_TYPES) {
    describe(`${name} (enumerable map from ${key.type} to ${value.type})`, function () {
      beforeEach(async function () {
        Object.assign(this, this.env[name]);
        [this.keyA, this.keyB, this.keyC] = this.keys;
        [this.valueA, this.valueB, this.valueC] = this.values;
      });

      shouldBehaveLikeMap();
    });
  }
});
