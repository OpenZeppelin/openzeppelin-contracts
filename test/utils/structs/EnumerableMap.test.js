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

describe('EnumerableMap', function () {
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

    shouldBehaveLikeMap(0n, 'address', {
      setReturn: `return$set_EnumerableMap_AddressToUintMap_address_uint256`,
      removeReturn: `return$remove_EnumerableMap_AddressToUintMap_address`,
    });
  });

  // UintToAddressMap
  describe('UintToAddressMap', function () {
    const fixture = async () => {
      const map = await ethers.deployContract('$EnumerableMap');

      const [keyA, keyB, keyC] = [uintA, uintB, uintC];
      const [valueA, valueB, valueC] = (await ethers.getSigners()).map(signer => signer.address);

      const methods = getMethods(map, {
        set: '$set(uint256,uint256,address)',
        get: `$get_EnumerableMap_UintToAddressMap(uint256,uint256)`,
        tryGet: `$tryGet_EnumerableMap_UintToAddressMap(uint256,uint256)`,
        remove: `$remove_EnumerableMap_UintToAddressMap(uint256,uint256)`,
        length: `$length_EnumerableMap_UintToAddressMap(uint256)`,
        at: `$at_EnumerableMap_UintToAddressMap(uint256,uint256)`,
        contains: `$contains_EnumerableMap_UintToAddressMap(uint256,uint256)`,
        keys: `$keys_EnumerableMap_UintToAddressMap(uint256)`,
      });

      return { map, keyA, keyB, keyC, valueA, valueB, valueC, methods };
    };

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikeMap(ethers.ZeroAddress, 'uint256', {
      setReturn: `return$set_EnumerableMap_UintToAddressMap_uint256_address`,
      removeReturn: `return$remove_EnumerableMap_UintToAddressMap_uint256`,
    });
  });

  // Bytes32ToBytes32Map
  describe('Bytes32ToBytes32Map', function () {
    const fixture = async () => {
      const map = await ethers.deployContract('$EnumerableMap');

      const [keyA, keyB, keyC] = [uintA, uintB, uintC].map(k =>
        ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [k]),
      );
      const [valueA, valueB, valueC] = [bytesA, bytesB, bytesC];

      const methods = getMethods(map, {
        set: '$set(uint256,bytes32,bytes32)',
        get: `$get_EnumerableMap_Bytes32ToBytes32Map(uint256,bytes32)`,
        tryGet: `$tryGet_EnumerableMap_Bytes32ToBytes32Map(uint256,bytes32)`,
        remove: `$remove_EnumerableMap_Bytes32ToBytes32Map(uint256,bytes32)`,
        length: `$length_EnumerableMap_Bytes32ToBytes32Map(uint256)`,
        at: `$at_EnumerableMap_Bytes32ToBytes32Map(uint256,uint256)`,
        contains: `$contains_EnumerableMap_Bytes32ToBytes32Map(uint256,bytes32)`,
        keys: `$keys_EnumerableMap_Bytes32ToBytes32Map(uint256)`,
      });

      return { map, keyA, keyB, keyC, valueA, valueB, valueC, methods };
    };

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikeMap(ethers.ZeroHash, 'bytes32', {
      setReturn: `return$set_EnumerableMap_Bytes32ToBytes32Map_bytes32_bytes32`,
      removeReturn: `return$remove_EnumerableMap_Bytes32ToBytes32Map_bytes32`,
    });
  });

  // UintToUintMap
  describe('UintToUintMap', function () {
    const fixture = async () => {
      const map = await ethers.deployContract('$EnumerableMap');

      const [keyA, keyB, keyC] = [uintA, uintB, uintC];
      const [valueA, valueB, valueC] = [uintA, uintB, uintC].map(v => v + 1332n);

      const methods = getMethods(map, {
        set: '$set(uint256,uint256,uint256)',
        get: `$get_EnumerableMap_UintToUintMap(uint256,uint256)`,
        tryGet: `$tryGet_EnumerableMap_UintToUintMap(uint256,uint256)`,
        remove: `$remove_EnumerableMap_UintToUintMap(uint256,uint256)`,
        length: `$length_EnumerableMap_UintToUintMap(uint256)`,
        at: `$at_EnumerableMap_UintToUintMap(uint256,uint256)`,
        contains: `$contains_EnumerableMap_UintToUintMap(uint256,uint256)`,
        keys: `$keys_EnumerableMap_UintToUintMap(uint256)`,
      });

      return { map, keyA, keyB, keyC, valueA, valueB, valueC, methods };
    };

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikeMap(0n, 'uint256', {
      setReturn: `return$set_EnumerableMap_UintToUintMap_uint256_uint256`,
      removeReturn: `return$remove_EnumerableMap_UintToUintMap_uint256`,
    });
  });

  // Bytes32ToUintMap
  describe('Bytes32ToUintMap', function () {
    const fixture = async () => {
      const map = await ethers.deployContract('$EnumerableMap');

      const [keyA, keyB, keyC] = [bytesA, bytesB, bytesC];
      const [valueA, valueB, valueC] = [uintA, uintB, uintC];

      const methods = getMethods(map, {
        set: '$set(uint256,bytes32,uint256)',
        get: `$get_EnumerableMap_Bytes32ToUintMap(uint256,bytes32)`,
        tryGet: `$tryGet_EnumerableMap_Bytes32ToUintMap(uint256,bytes32)`,
        remove: `$remove_EnumerableMap_Bytes32ToUintMap(uint256,bytes32)`,
        length: `$length_EnumerableMap_Bytes32ToUintMap(uint256)`,
        at: `$at_EnumerableMap_Bytes32ToUintMap(uint256,uint256)`,
        contains: `$contains_EnumerableMap_Bytes32ToUintMap(uint256,bytes32)`,
        keys: `$keys_EnumerableMap_Bytes32ToUintMap(uint256)`,
      });

      return { map, keyA, keyB, keyC, valueA, valueB, valueC, methods };
    };

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikeMap(0n, 'bytes32', {
      setReturn: `return$set_EnumerableMap_Bytes32ToUintMap_bytes32_uint256`,
      removeReturn: `return$remove_EnumerableMap_Bytes32ToUintMap_bytes32`,
    });
  });
});
