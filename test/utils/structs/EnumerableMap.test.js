const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { mapValues } = require('../../helpers/iterate');
const { randomArray, generators } = require('../../helpers/random');
const { TYPES, formatType } = require('../../../scripts/generate/templates/EnumerableMap.opts');

const { shouldBehaveLikeMap } = require('./EnumerableMap.behavior');

const getMethods = (mock, fnSigs) => {
  return mapValues(
    fnSigs,
    fnSig =>
      (...args) =>
        mock.getFunction(fnSig)(0, ...args),
  );
};

const testTypes = [formatType('bytes32', 'bytes32'), ...TYPES];

async function fixture() {
  const mock = await ethers.deployContract('$EnumerableMap');

  const zeroValue = {
    uint256: 0n,
    address: ethers.ZeroAddress,
    bytes32: ethers.ZeroHash,
  };

  const env = Object.fromEntries(
    testTypes.map(({ name, keyType, valueType }) => [
      name,
      {
        keyType,
        keys: randomArray(generators[keyType]),
        values: randomArray(generators[valueType]),

        methods: getMethods(
          mock,
          testTypes.filter(t => keyType == t.keyType).length == 1
            ? {
                set: `$set(uint256,${keyType},${valueType})`,
                get: `$get(uint256,${keyType})`,
                tryGet: `$tryGet(uint256,${keyType})`,
                remove: `$remove(uint256,${keyType})`,
                length: `$length_EnumerableMap_${name}(uint256)`,
                at: `$at_EnumerableMap_${name}(uint256,uint256)`,
                contains: `$contains(uint256,${keyType})`,
                keys: `$keys_EnumerableMap_${name}(uint256)`,
              }
            : {
                set: `$set(uint256,${keyType},${valueType})`,
                get: `$get_EnumerableMap_${name}(uint256,${keyType})`,
                tryGet: `$tryGet_EnumerableMap_${name}(uint256,${keyType})`,
                remove: `$remove_EnumerableMap_${name}(uint256,${keyType})`,
                length: `$length_EnumerableMap_${name}(uint256)`,
                at: `$at_EnumerableMap_${name}(uint256,uint256)`,
                contains: `$contains_EnumerableMap_${name}(uint256,${keyType})`,
                keys: `$keys_EnumerableMap_${name}(uint256)`,
              },
        ),

        zeroValue: zeroValue[valueType],
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

  // UintToAddressMap
  for (const { name } of testTypes) {
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
