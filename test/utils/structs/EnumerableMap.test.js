import { network } from 'hardhat';
import { mapValues } from '../../helpers/iterate';
import * as random from '../../helpers/random';
import { TYPES, MAP_TYPES } from '../../../scripts/generate/data.js';
import { shouldBehaveLikeMap } from './EnumerableMap.behavior';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.create();

// Add Bytes32ToBytes32Map that must be tested but is not part of the generated types.
MAP_TYPES.unshift({ name: 'Bytes32ToBytes32Map', key: TYPES.bytes32, value: TYPES.bytes32 });

// Chai matchers expect hexadecimal data when dealing with bytes
const randomOf = type => random[type === 'bytes' ? 'hexBytes' : type];

async function fixture() {
  const mock = await ethers.deployContract('$EnumerableMap');

  const env = Object.fromEntries(
    MAP_TYPES.map(({ name, key, value }) => [
      name,
      {
        key,
        value,
        keys: Array.from({ length: 3 }, randomOf(key.type)),
        values: Array.from({ length: 3 }, randomOf(value.type)),
        zeroValue: randomOf(value.type).zero,
        methods: mapValues(
          MAP_TYPES.filter(map => map.key.type == key.type).length == 1
            ? {
                set: `$set(uint256,${key.type},${value.type})`,
                get: `$get(uint256,${key.type})`,
                tryGet: `$tryGet(uint256,${key.type})`,
                remove: `$remove(uint256,${key.type})`,
                removeAt: `$removeAt_EnumerableMap_${name}(uint256,uint256)`,
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
                removeAt: `$removeAt_EnumerableMap_${name}(uint256,uint256)`,
                contains: `$contains_EnumerableMap_${name}(uint256,${key.type})`,
                clear: `$clear_EnumerableMap_${name}(uint256)`,
                length: `$length_EnumerableMap_${name}(uint256)`,
                at: `$at_EnumerableMap_${name}(uint256,uint256)`,
                keys: `$keys_EnumerableMap_${name}(uint256)`,
                keysPage: `$keys_EnumerableMap_${name}(uint256,uint256,uint256)`,
              },
          fnSig =>
            Object.assign((...args) => mock.getFunction(fnSig)(0, ...args), {
              staticCall: (...args) => mock.getFunction(fnSig).staticCall(0, ...args),
            }),
        ),
        events: {
          setReturn: `return$set_EnumerableMap_${name}_${key.type}_${value.type}`,
          removeReturn: `return$remove_EnumerableMap_${name}_${key.type}`,
        },
        error: key.size && value.size ? `EnumerableMapNonexistentKey` : `EnumerableMapNonexistent${key.name}Key`,
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
