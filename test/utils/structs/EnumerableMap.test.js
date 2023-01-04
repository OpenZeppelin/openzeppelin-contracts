const { BN, constants } = require('@openzeppelin/test-helpers');
const { mapValues } = require('../../helpers/map-values');

const EnumerableMap = artifacts.require('$EnumerableMap');

const { shouldBehaveLikeMap } = require('./EnumerableMap.behavior');

const getMethods = ms => {
  return mapValues(
    ms,
    m =>
      (self, ...args) =>
        self.methods[m](0, ...args),
  );
};

contract('EnumerableMap', function (accounts) {
  const [accountA, accountB, accountC] = accounts;

  const keyA = new BN('7891');
  const keyB = new BN('451');
  const keyC = new BN('9592328');

  const bytesA = '0xdeadbeef'.padEnd(66, '0');
  const bytesB = '0x0123456789'.padEnd(66, '0');
  const bytesC = '0x42424242'.padEnd(66, '0');

  beforeEach(async function () {
    this.map = await EnumerableMap.new();
  });

  // AddressToUintMap
  describe('AddressToUintMap', function () {
    shouldBehaveLikeMap(
      [accountA, accountB, accountC],
      [keyA, keyB, keyC],
      new BN('0'),
      getMethods({
        set: '$set(uint256,address,uint256)',
        get: '$get(uint256,address)',
        getWithMessage: '$get(uint256,address,string)',
        tryGet: '$tryGet(uint256,address)',
        remove: '$remove(uint256,address)',
        length: '$length_EnumerableMap_AddressToUintMap(uint256)',
        at: '$at_EnumerableMap_AddressToUintMap(uint256,uint256)',
        contains: '$contains(uint256,address)',
        keys: '$keys_EnumerableMap_AddressToUintMap(uint256)',
      }),
      {
        setReturn: 'return$set_EnumerableMap_AddressToUintMap_address_uint256',
        removeReturn: 'return$remove_EnumerableMap_AddressToUintMap_address',
      },
    );
  });

  // UintToAddressMap
  describe('UintToAddressMap', function () {
    shouldBehaveLikeMap(
      [keyA, keyB, keyC],
      [accountA, accountB, accountC],
      constants.ZERO_ADDRESS,
      getMethods({
        set: '$set(uint256,uint256,address)',
        get: '$get_EnumerableMap_UintToAddressMap(uint256,uint256)',
        getWithMessage: '$get_EnumerableMap_UintToAddressMap(uint256,uint256,string)',
        tryGet: '$tryGet_EnumerableMap_UintToAddressMap(uint256,uint256)',
        remove: '$remove_EnumerableMap_UintToAddressMap(uint256,uint256)',
        length: '$length_EnumerableMap_UintToAddressMap(uint256)',
        at: '$at_EnumerableMap_UintToAddressMap(uint256,uint256)',
        contains: '$contains_EnumerableMap_UintToAddressMap(uint256,uint256)',
        keys: '$keys_EnumerableMap_UintToAddressMap(uint256)',
      }),
      {
        setReturn: 'return$set_EnumerableMap_UintToAddressMap_uint256_address',
        removeReturn: 'return$remove_EnumerableMap_UintToAddressMap_uint256',
      },
    );
  });

  // Bytes32ToBytes32Map
  describe('Bytes32ToBytes32Map', function () {
    shouldBehaveLikeMap(
      [keyA, keyB, keyC].map(k => '0x' + k.toString(16).padEnd(64, '0')),
      [bytesA, bytesB, bytesC],
      constants.ZERO_BYTES32,
      getMethods({
        set: '$set(uint256,bytes32,bytes32)',
        get: '$get_EnumerableMap_Bytes32ToBytes32Map(uint256,bytes32)',
        getWithMessage: '$get_EnumerableMap_Bytes32ToBytes32Map(uint256,bytes32,string)',
        tryGet: '$tryGet_EnumerableMap_Bytes32ToBytes32Map(uint256,bytes32)',
        remove: '$remove_EnumerableMap_Bytes32ToBytes32Map(uint256,bytes32)',
        length: '$length_EnumerableMap_Bytes32ToBytes32Map(uint256)',
        at: '$at_EnumerableMap_Bytes32ToBytes32Map(uint256,uint256)',
        contains: '$contains_EnumerableMap_Bytes32ToBytes32Map(uint256,bytes32)',
        keys: '$keys_EnumerableMap_Bytes32ToBytes32Map(uint256)',
      }),
      {
        setReturn: 'return$set_EnumerableMap_Bytes32ToBytes32Map_bytes32_bytes32',
        removeReturn: 'return$remove_EnumerableMap_Bytes32ToBytes32Map_bytes32',
      },
    );
  });

  // UintToUintMap
  describe('UintToUintMap', function () {
    shouldBehaveLikeMap(
      [keyA, keyB, keyC],
      [keyA, keyB, keyC].map(k => k.add(new BN('1332'))),
      new BN('0'),
      getMethods({
        set: '$set(uint256,uint256,uint256)',
        get: '$get_EnumerableMap_UintToUintMap(uint256,uint256)',
        getWithMessage: '$get_EnumerableMap_UintToUintMap(uint256,uint256,string)',
        tryGet: '$tryGet_EnumerableMap_UintToUintMap(uint256,uint256)',
        remove: '$remove_EnumerableMap_UintToUintMap(uint256,uint256)',
        length: '$length_EnumerableMap_UintToUintMap(uint256)',
        at: '$at_EnumerableMap_UintToUintMap(uint256,uint256)',
        contains: '$contains_EnumerableMap_UintToUintMap(uint256,uint256)',
        keys: '$keys_EnumerableMap_UintToUintMap(uint256)',
      }),
      {
        setReturn: 'return$set_EnumerableMap_UintToUintMap_uint256_uint256',
        removeReturn: 'return$remove_EnumerableMap_UintToUintMap_uint256',
      },
    );
  });

  // Bytes32ToUintMap
  describe('Bytes32ToUintMap', function () {
    shouldBehaveLikeMap(
      [bytesA, bytesB, bytesC],
      [keyA, keyB, keyC],
      new BN('0'),
      getMethods({
        set: '$set(uint256,bytes32,uint256)',
        get: '$get_EnumerableMap_Bytes32ToUintMap(uint256,bytes32)',
        getWithMessage: '$get_EnumerableMap_Bytes32ToUintMap(uint256,bytes32,string)',
        tryGet: '$tryGet_EnumerableMap_Bytes32ToUintMap(uint256,bytes32)',
        remove: '$remove_EnumerableMap_Bytes32ToUintMap(uint256,bytes32)',
        length: '$length_EnumerableMap_Bytes32ToUintMap(uint256)',
        at: '$at_EnumerableMap_Bytes32ToUintMap(uint256,uint256)',
        contains: '$contains_EnumerableMap_Bytes32ToUintMap(uint256,bytes32)',
        keys: '$keys_EnumerableMap_Bytes32ToUintMap(uint256)',
      }),
      {
        setReturn: 'return$set_EnumerableMap_Bytes32ToUintMap_bytes32_uint256',
        removeReturn: 'return$remove_EnumerableMap_Bytes32ToUintMap_bytes32',
      },
    );
  });
});
