const EnumerableSet = artifacts.require('$EnumerableSet');

const { shouldBehaveLikeSet } = require('./EnumerableSet.behavior');

contract('EnumerableSet', function (accounts) {
  beforeEach(async function () {
    this.set = await EnumerableSet.new();
  });

  // Bytes32Set
  describe('EnumerableBytes32Set', function () {
    shouldBehaveLikeSet(
      [ '0xdeadbeef', '0x0123456789', '0x42424242' ].map(e => e.padEnd(66, '0')),
      {
        fnAdd: (self, ...args) => self.methods['$add(uint256,bytes32)'](0, ...args),
        fnRemove: (self, ...args) => self.methods['$remove(uint256,bytes32)'](0, ...args),
        fnContains: (self, ...args) => self.methods['$contains(uint256,bytes32)'](0, ...args),
        fnLength: (self, ...args) => self.methods['$length_EnumerableSet_Bytes32Set(uint256)'](0, ...args),
        fnAt: (self, ...args) => self.methods['$at_EnumerableSet_Bytes32Set(uint256,uint256)'](0, ...args),
        fnValues: (self, ...args) => self.methods['$values_EnumerableSet_Bytes32Set(uint256)'](0, ...args),
        evAdd: '$add_EnumerableSet_Bytes32Set_bytes32_Returned',
        evRemove: '$remove_EnumerableSet_Bytes32Set_bytes32_Returned',
      },
    );
  });

  // AddressSet
  describe('EnumerableAddressSet', function () {
    shouldBehaveLikeSet(
      accounts,
      {
        fnAdd: (self, ...args) => self.methods['$add(uint256,address)'](0, ...args),
        fnRemove: (self, ...args) => self.methods['$remove(uint256,address)'](0, ...args),
        fnContains: (self, ...args) => self.methods['$contains(uint256,address)'](0, ...args),
        fnLength: (self, ...args) => self.methods['$length_EnumerableSet_AddressSet(uint256)'](0, ...args),
        fnAt: (self, ...args) => self.methods['$at_EnumerableSet_AddressSet(uint256,uint256)'](0, ...args),
        fnValues: (self, ...args) => self.methods['$values_EnumerableSet_AddressSet(uint256)'](0, ...args),
        evAdd: '$add_EnumerableSet_AddressSet_address_Returned',
        evRemove: '$remove_EnumerableSet_AddressSet_address_Returned',
      },
    );
  });

  // UintSet
  describe('EnumerableUintSet', function () {
    shouldBehaveLikeSet(
      [ 1234, 5678, 9101112 ].map(e => web3.utils.toBN(e)),
      {
        fnAdd: (self, ...args) => self.methods['$add(uint256,uint256)'](0, ...args),
        fnRemove: (self, ...args) => self.methods['$remove(uint256,uint256)'](0, ...args),
        fnContains: (self, ...args) => self.methods['$contains(uint256,uint256)'](0, ...args),
        fnLength: (self, ...args) => self.methods['$length_EnumerableSet_UintSet(uint256)'](0, ...args),
        fnAt: (self, ...args) => self.methods['$at_EnumerableSet_UintSet(uint256,uint256)'](0, ...args),
        fnValues: (self, ...args) => self.methods['$values_EnumerableSet_UintSet(uint256)'](0, ...args),
        evAdd: '$add_EnumerableSet_UintSet_uint256_Returned',
        evRemove: '$remove_EnumerableSet_UintSet_uint256_Returned',
      },
    );
  });
});
