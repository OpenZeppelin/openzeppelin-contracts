const EnumerableSet = artifacts.require('$EnumerableSet');
const { mapValues } = require('../../helpers/map-values');

const { shouldBehaveLikeSet } = require('./EnumerableSet.behavior');

const getMethods = ms => {
  return mapValues(
    ms,
    m =>
      (self, ...args) =>
        self.methods[m](0, ...args),
  );
};

contract('EnumerableSet', function (accounts) {
  beforeEach(async function () {
    this.set = await EnumerableSet.new();
  });

  // Bytes32Set
  describe('EnumerableBytes32Set', function () {
    shouldBehaveLikeSet(
      ['0xdeadbeef', '0x0123456789', '0x42424242'].map(e => e.padEnd(66, '0')),
      getMethods({
        add: '$add(uint256,bytes32)',
        remove: '$remove(uint256,bytes32)',
        contains: '$contains(uint256,bytes32)',
        length: '$length_EnumerableSet_Bytes32Set(uint256)',
        at: '$at_EnumerableSet_Bytes32Set(uint256,uint256)',
        values: '$values_EnumerableSet_Bytes32Set(uint256)',
      }),
      {
        addReturn: 'return$add_EnumerableSet_Bytes32Set_bytes32',
        removeReturn: 'return$remove_EnumerableSet_Bytes32Set_bytes32',
      },
    );
  });

  // AddressSet
  describe('EnumerableAddressSet', function () {
    shouldBehaveLikeSet(
      accounts,
      getMethods({
        add: '$add(uint256,address)',
        remove: '$remove(uint256,address)',
        contains: '$contains(uint256,address)',
        length: '$length_EnumerableSet_AddressSet(uint256)',
        at: '$at_EnumerableSet_AddressSet(uint256,uint256)',
        values: '$values_EnumerableSet_AddressSet(uint256)',
      }),
      {
        addReturn: 'return$add_EnumerableSet_AddressSet_address',
        removeReturn: 'return$remove_EnumerableSet_AddressSet_address',
      },
    );
  });

  // UintSet
  describe('EnumerableUintSet', function () {
    shouldBehaveLikeSet(
      [1234, 5678, 9101112].map(e => web3.utils.toBN(e)),
      getMethods({
        add: '$add(uint256,uint256)',
        remove: '$remove(uint256,uint256)',
        contains: '$contains(uint256,uint256)',
        length: '$length_EnumerableSet_UintSet(uint256)',
        at: '$at_EnumerableSet_UintSet(uint256,uint256)',
        values: '$values_EnumerableSet_UintSet(uint256)',
      }),
      {
        addReturn: 'return$add_EnumerableSet_UintSet_uint256',
        removeReturn: 'return$remove_EnumerableSet_UintSet_uint256',
      },
    );
  });
});
