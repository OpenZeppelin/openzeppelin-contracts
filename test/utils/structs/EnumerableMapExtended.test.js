const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { mapValues } = require('../../helpers/iterate');
const { generators } = require('../../helpers/random');
const { EXTENDED_MAP_TYPES } = require('../../../scripts/generate/templates/Enumerable.opts');

const { shouldBehaveLikeMap } = require('./EnumerableMap.behavior');

async function fixture() {
  const mock = await ethers.deployContract('$EnumerableMapExtended');

  const env = Object.fromEntries(
    EXTENDED_MAP_TYPES.map(({ name, key, value }) => [
      name,
      {
        key,
        value,
        keys: Array.from({ length: 3 }, generators[key.type]),
        values: Array.from({ length: 3 }, generators[value.type]),
        zeroValue: generators[value.type].zero,
        methods: mapValues(
          {
            set: `$set(uint256,${key.type},${value.type})`,
            get: `$get(uint256,${key.type})`,
            tryGet: `$tryGet(uint256,${key.type})`,
            remove: `$remove(uint256,${key.type})`,
            clear: `$clear_EnumerableMapExtended_${name}(uint256)`,
            length: `$length_EnumerableMapExtended_${name}(uint256)`,
            at: `$at_EnumerableMapExtended_${name}(uint256,uint256)`,
            contains: `$contains(uint256,${key.type})`,
            keys: `$keys_EnumerableMapExtended_${name}(uint256)`,
          },
          fnSig =>
            (...args) =>
              mock.getFunction(fnSig)(0, ...args),
        ),
        events: {
          setReturn: `return$set_EnumerableMapExtended_${name}_${key.type}_${value.type}`,
          removeReturn: `return$remove_EnumerableMapExtended_${name}_${key.type}`,
        },
        error: key.memory || value.memory ? `EnumerableMapNonexistent${key.name}Key` : `EnumerableMapNonexistentKey`,
      },
    ]),
  );

  return { mock, env };
}

describe('EnumerableMapExtended', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  for (const { name, key, value } of EXTENDED_MAP_TYPES) {
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
