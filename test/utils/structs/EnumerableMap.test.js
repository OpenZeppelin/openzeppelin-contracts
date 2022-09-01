const { BN, constants } = require('@openzeppelin/test-helpers');

const EnumerableMap = artifacts.require('$EnumerableMap');

const { shouldBehaveLikeMap } = require('./EnumerableMap.behavior');

contract('EnumerableMap', function (accounts) {
  const [ accountA, accountB, accountC ] = accounts;

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
      [ accountA, accountB, accountC ],
      [ keyA, keyB, keyC ],
      new BN('0'),
      {
        fnSet: (self, ...args) =>
          self.methods['$set(uint256,address,uint256)'](0, ...args),
        fnGet: (self, ...args) =>
          self.methods['$get(uint256,address)'](0, ...args),
        fnGetWithMessage: (self, ...args) =>
          self.methods['$get(uint256,address,string)'](0, ...args),
        fnTryGet: (self, ...args) =>
          self.methods['$tryGet(uint256,address)'](0, ...args),
        fnRemove: (self, ...args) =>
          self.methods['$remove(uint256,address)'](0, ...args),
        fnLength: (self, ...args) =>
          self.methods['$length_EnumerableMap_AddressToUintMap(uint256)'](0, ...args),
        fnAt: (self, ...args) =>
          self.methods['$at_EnumerableMap_AddressToUintMap(uint256,uint256)'](0, ...args),
        fnContains: (self, ...args) =>
          self.methods['$contains(uint256,address)'](0, ...args),
        evSet: '$set_EnumerableMap_AddressToUintMap_address_uint256_Returned',
        evRemove: '$remove_EnumerableMap_AddressToUintMap_address_Returned',
        argsPrefix: [ 0 ],
      },
    );
  });

  // UintToAddressMap
  describe('UintToAddressMap', function () {
    shouldBehaveLikeMap(
      [ keyA, keyB, keyC ],
      [ accountA, accountB, accountC ],
      constants.ZERO_ADDRESS,
      {
        fnSet: (self, ...args) =>
          self.methods['$set(uint256,uint256,address)'](0, ...args),
        fnGet: (self, ...args) =>
          self.methods['$get_EnumerableMap_UintToAddressMap(uint256,uint256)'](0, ...args),
        fnGetWithMessage: (self, ...args) =>
          self.methods['$get_EnumerableMap_UintToAddressMap(uint256,uint256,string)'](0, ...args),
        fnTryGet: (self, ...args) =>
          self.methods['$tryGet_EnumerableMap_UintToAddressMap(uint256,uint256)'](0, ...args),
        fnRemove: (self, ...args) =>
          self.methods['$remove_EnumerableMap_UintToAddressMap(uint256,uint256)'](0, ...args),
        fnLength: (self, ...args) =>
          self.methods['$length_EnumerableMap_UintToAddressMap(uint256)'](0, ...args),
        fnAt: (self, ...args) =>
          self.methods['$at_EnumerableMap_UintToAddressMap(uint256,uint256)'](0, ...args),
        fnContains: (self, ...args) =>
          self.methods['$contains_EnumerableMap_UintToAddressMap(uint256,uint256)'](0, ...args),
        evSet: '$set_EnumerableMap_UintToAddressMap_uint256_address_Returned',
        evRemove: '$remove_EnumerableMap_UintToAddressMap_uint256_Returned',
        argsPrefix: [ 0 ],
      },
    );
  });

  // Bytes32ToBytes32Map
  describe('Bytes32ToBytes32Map', function () {
    shouldBehaveLikeMap(
      [ keyA, keyB, keyC ].map(k => '0x' + k.toString(16).padEnd(64, '0')),
      [ bytesA, bytesB, bytesC ],
      constants.ZERO_BYTES32,
      {
        fnSet: (self, ...args) =>
          self.methods['$set(uint256,bytes32,bytes32)'](0, ...args),
        fnGet: (self, ...args) =>
          self.methods['$get_EnumerableMap_Bytes32ToBytes32Map(uint256,bytes32)'](0, ...args),
        fnGetWithMessage: (self, ...args) =>
          self.methods['$get_EnumerableMap_Bytes32ToBytes32Map(uint256,bytes32,string)'](0, ...args),
        fnTryGet: (self, ...args) =>
          self.methods['$tryGet_EnumerableMap_Bytes32ToBytes32Map(uint256,bytes32)'](0, ...args),
        fnRemove: (self, ...args) =>
          self.methods['$remove_EnumerableMap_Bytes32ToBytes32Map(uint256,bytes32)'](0, ...args),
        fnLength: (self, ...args) =>
          self.methods['$length_EnumerableMap_Bytes32ToBytes32Map(uint256)'](0, ...args),
        fnAt: (self, ...args) =>
          self.methods['$at_EnumerableMap_Bytes32ToBytes32Map(uint256,uint256)'](0, ...args),
        fnContains: (self, ...args) =>
          self.methods['$contains_EnumerableMap_Bytes32ToBytes32Map(uint256,bytes32)'](0, ...args),
        evSet: '$set_EnumerableMap_Bytes32ToBytes32Map_bytes32_bytes32_Returned',
        evRemove: '$remove_EnumerableMap_Bytes32ToBytes32Map_bytes32_Returned',
        argsPrefix: [ 0 ],
      },
    );
  });

  // UintToUintMap
  describe('UintToUintMap', function () {
    shouldBehaveLikeMap(
      [ keyA, keyB, keyC ],
      [ keyA, keyB, keyC ].map(k => k.add(new BN('1332'))),
      new BN('0'),
      {
        fnSet: (self, ...args) =>
          self.methods['$set(uint256,uint256,uint256)'](0, ...args),
        fnGet: (self, ...args) =>
          self.methods['$get_EnumerableMap_UintToUintMap(uint256,uint256)'](0, ...args),
        fnGetWithMessage: (self, ...args) =>
          self.methods['$get_EnumerableMap_UintToUintMap(uint256,uint256,string)'](0, ...args),
        fnTryGet: (self, ...args) =>
          self.methods['$tryGet_EnumerableMap_UintToUintMap(uint256,uint256)'](0, ...args),
        fnRemove: (self, ...args) =>
          self.methods['$remove_EnumerableMap_UintToUintMap(uint256,uint256)'](0, ...args),
        fnLength: (self, ...args) =>
          self.methods['$length_EnumerableMap_UintToUintMap(uint256)'](0, ...args),
        fnAt: (self, ...args) =>
          self.methods['$at_EnumerableMap_UintToUintMap(uint256,uint256)'](0, ...args),
        fnContains: (self, ...args) =>
          self.methods['$contains_EnumerableMap_UintToUintMap(uint256,uint256)'](0, ...args),
        evSet: '$set_EnumerableMap_UintToUintMap_uint256_uint256_Returned',
        evRemove: '$remove_EnumerableMap_UintToUintMap_uint256_Returned',
        argsPrefix: [ 0 ],
      },
    );
  });

  // Bytes32ToUintMap
  describe('Bytes32ToUintMap', function () {
    shouldBehaveLikeMap(
      [ bytesA, bytesB, bytesC ],
      [ keyA, keyB, keyC ],
      new BN('0'),
      {
        fnSet: (self, ...args) =>
          self.methods['$set(uint256,bytes32,uint256)'](0, ...args),
        fnGet: (self, ...args) =>
          self.methods['$get_EnumerableMap_Bytes32ToUintMap(uint256,bytes32)'](0, ...args),
        fnGetWithMessage: (self, ...args) =>
          self.methods['$get_EnumerableMap_Bytes32ToUintMap(uint256,bytes32,string)'](0, ...args),
        fnTryGet: (self, ...args) =>
          self.methods['$tryGet_EnumerableMap_Bytes32ToUintMap(uint256,bytes32)'](0, ...args),
        fnRemove: (self, ...args) =>
          self.methods['$remove_EnumerableMap_Bytes32ToUintMap(uint256,bytes32)'](0, ...args),
        fnLength: (self, ...args) =>
          self.methods['$length_EnumerableMap_Bytes32ToUintMap(uint256)'](0, ...args),
        fnAt: (self, ...args) =>
          self.methods['$at_EnumerableMap_Bytes32ToUintMap(uint256,uint256)'](0, ...args),
        fnContains: (self, ...args) =>
          self.methods['$contains_EnumerableMap_Bytes32ToUintMap(uint256,bytes32)'](0, ...args),
        evSet: '$set_EnumerableMap_Bytes32ToUintMap_bytes32_uint256_Returned',
        evRemove: '$remove_EnumerableMap_Bytes32ToUintMap_bytes32_Returned',
        argsPrefix: [ 0 ],
      },
    );
  });
});
