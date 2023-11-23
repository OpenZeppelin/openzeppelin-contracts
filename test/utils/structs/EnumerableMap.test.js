const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { mapValues } = require('../../helpers/iterate');
const { randomArray, generators } = require('../../helpers/random');

const { shouldBehaveLikeMap } = require('./EnumerableMap.behavior');

const getMethods = (mock, fnSigs) => {
  return mapValues(
    fnSigs,
    fnSig =>
      (...args) =>
        mock.getFunction(fnSig)(0, ...args),
  );
};

describe('EnumerableMap', function () {
  // UintToAddressMap
  describe('UintToAddressMap', function () {
    const fixture = async () => {
      const mock = await ethers.deployContract('$EnumerableMap');

      const [keyA, keyB, keyC] = randomArray(generators.uint256);
      const [valueA, valueB, valueC] = randomArray(generators.address);

      const methods = getMethods(mock, {
        set: '$set(uint256,uint256,address)',
        get: '$get_EnumerableMap_UintToAddressMap(uint256,uint256)',
        tryGet: '$tryGet_EnumerableMap_UintToAddressMap(uint256,uint256)',
        remove: '$remove_EnumerableMap_UintToAddressMap(uint256,uint256)',
        length: '$length_EnumerableMap_UintToAddressMap(uint256)',
        at: '$at_EnumerableMap_UintToAddressMap(uint256,uint256)',
        contains: '$contains_EnumerableMap_UintToAddressMap(uint256,uint256)',
        keys: '$keys_EnumerableMap_UintToAddressMap(uint256)',
      });

      return { mock, keyA, keyB, keyC, valueA, valueB, valueC, methods };
    };

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikeMap(ethers.ZeroAddress, 'uint256', {
      setReturn: 'return$set_EnumerableMap_UintToAddressMap_uint256_address',
      removeReturn: 'return$remove_EnumerableMap_UintToAddressMap_uint256',
    });
  });

  // Bytes32ToBytes32Map
  describe('Bytes32ToBytes32Map', function () {
    const fixture = async () => {
      const mock = await ethers.deployContract('$EnumerableMap');

      const [keyA, keyB, keyC] = randomArray(generators.bytes32);
      const [valueA, valueB, valueC] = randomArray(generators.bytes32);

      const methods = getMethods(mock, {
        set: '$set(uint256,bytes32,bytes32)',
        get: '$get_EnumerableMap_Bytes32ToBytes32Map(uint256,bytes32)',
        tryGet: '$tryGet_EnumerableMap_Bytes32ToBytes32Map(uint256,bytes32)',
        remove: '$remove_EnumerableMap_Bytes32ToBytes32Map(uint256,bytes32)',
        length: '$length_EnumerableMap_Bytes32ToBytes32Map(uint256)',
        at: '$at_EnumerableMap_Bytes32ToBytes32Map(uint256,uint256)',
        contains: '$contains_EnumerableMap_Bytes32ToBytes32Map(uint256,bytes32)',
        keys: '$keys_EnumerableMap_Bytes32ToBytes32Map(uint256)',
      });

      return { mock, keyA, keyB, keyC, valueA, valueB, valueC, methods };
    };

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikeMap(ethers.ZeroHash, 'bytes32', {
      setReturn: 'return$set_EnumerableMap_Bytes32ToBytes32Map_bytes32_bytes32',
      removeReturn: 'return$remove_EnumerableMap_Bytes32ToBytes32Map_bytes32',
    });
  });

  // UintToUintMap
  describe('UintToUintMap', function () {
    const fixture = async () => {
      const mock = await ethers.deployContract('$EnumerableMap');

      const [keyA, keyB, keyC] = randomArray(generators.uint256);
      const [valueA, valueB, valueC] = randomArray(generators.uint256);

      const methods = getMethods(mock, {
        set: '$set(uint256,uint256,uint256)',
        get: '$get_EnumerableMap_UintToUintMap(uint256,uint256)',
        tryGet: '$tryGet_EnumerableMap_UintToUintMap(uint256,uint256)',
        remove: '$remove_EnumerableMap_UintToUintMap(uint256,uint256)',
        length: '$length_EnumerableMap_UintToUintMap(uint256)',
        at: '$at_EnumerableMap_UintToUintMap(uint256,uint256)',
        contains: '$contains_EnumerableMap_UintToUintMap(uint256,uint256)',
        keys: '$keys_EnumerableMap_UintToUintMap(uint256)',
      });

      return { mock, keyA, keyB, keyC, valueA, valueB, valueC, methods };
    };

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikeMap(0n, 'uint256', {
      setReturn: 'return$set_EnumerableMap_UintToUintMap_uint256_uint256',
      removeReturn: 'return$remove_EnumerableMap_UintToUintMap_uint256',
    });
  });

  // Bytes32ToUintMap
  describe('Bytes32ToUintMap', function () {
    const fixture = async () => {
      const mock = await ethers.deployContract('$EnumerableMap');

      const [keyA, keyB, keyC] = randomArray(generators.bytes32);
      const [valueA, valueB, valueC] = randomArray(generators.uint256);

      const methods = getMethods(mock, {
        set: '$set(uint256,bytes32,uint256)',
        get: '$get_EnumerableMap_Bytes32ToUintMap(uint256,bytes32)',
        tryGet: '$tryGet_EnumerableMap_Bytes32ToUintMap(uint256,bytes32)',
        remove: '$remove_EnumerableMap_Bytes32ToUintMap(uint256,bytes32)',
        length: '$length_EnumerableMap_Bytes32ToUintMap(uint256)',
        at: '$at_EnumerableMap_Bytes32ToUintMap(uint256,uint256)',
        contains: '$contains_EnumerableMap_Bytes32ToUintMap(uint256,bytes32)',
        keys: '$keys_EnumerableMap_Bytes32ToUintMap(uint256)',
      });

      return { mock, keyA, keyB, keyC, valueA, valueB, valueC, methods };
    };

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikeMap(0n, 'bytes32', {
      setReturn: 'return$set_EnumerableMap_Bytes32ToUintMap_bytes32_uint256',
      removeReturn: 'return$remove_EnumerableMap_Bytes32ToUintMap_bytes32',
    });
  });
});
