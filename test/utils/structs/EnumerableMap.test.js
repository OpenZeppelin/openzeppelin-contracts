const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { mapValues } = require('../../helpers/iterate');

const { shouldBehaveLikeMap } = require('./EnumerableMap.behavior');

const getMethods = (map, fnSigs) => {
  return mapValues(
    fnSigs,
    m =>
      (...args) =>
        map.getFunction(m)(0, ...args),
  );
};

describe.only('EnumerableMap', function () {
  const uintA = 7891n;
  const uintB = 451n;
  const uintC = 9592328n;

  const bytesA = '0xdeadbeef'.padEnd(66, '0');
  const bytesB = '0x0123456789'.padEnd(66, '0');
  const bytesC = '0x42424242'.padEnd(66, '0');

  // AddressToUintMap
  describe('AddressToUintMap', function () {
    const fixture = async () => {
      const map = await ethers.deployContract('$EnumerableMap');

      const [keyA, keyB, keyC] = (await ethers.getSigners()).map(signer => signer.address);
      const [valueA, valueB, valueC] = [uintA, uintB, uintC];

      const methods = getMethods(map, {
        set: '$set(uint256,address,uint256)',
        get: '$get(uint256,address)',
        tryGet: '$tryGet(uint256,address)',
        remove: '$remove(uint256,address)',
        length: `$length_EnumerableMap_AddressToUintMap(uint256)`,
        at: `$at_EnumerableMap_AddressToUintMap(uint256,uint256)`,
        contains: '$contains(uint256,address)',
        keys: `$keys_EnumerableMap_AddressToUintMap(uint256)`,
      });

      return { map, keyA, keyB, keyC, valueA, valueB, valueC, methods };
    };

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikeMap(0n, {
      setReturn: `return$set_EnumerableMap_AddressToUintMap_address_uint256`,
      removeReturn: `return$remove_EnumerableMap_AddressToUintMap_address`,
    });
  });
});
