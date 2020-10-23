const { accounts, contract } = require('@openzeppelin/test-environment');
const { BN } = require('@openzeppelin/test-helpers');

const EnumerableBytesSetMock = contract.fromArtifact('EnumerableBytesSetMock');
const EnumerableAddressSetMock = contract.fromArtifact('EnumerableAddressSetMock');
const EnumerableUintSetMock = contract.fromArtifact('EnumerableUintSetMock');

const { shouldBehaveLikeSet } = require('./EnumerableSet.behavior');

describe('EnumerableSet', function() {
  // BytesSet
  describe('EnumerableBytesSet', function() {
    const bytesA = '0xdeadbeef'.padEnd(66, '0');
    const bytesB = '0x0123456789'.padEnd(66, '0');
    const bytesC = '0x42424242'.padEnd(66, '0');

    beforeEach(async function() {
      this.set = await EnumerableBytesSetMock.new();
    });

    shouldBehaveLikeSet(bytesA, bytesB, bytesC);
  });

  // AddressSet
  describe('EnumerableAddressSet', function() {
    const [accountA, accountB, accountC] = accounts;

    beforeEach(async function() {
      this.set = await EnumerableAddressSetMock.new();
    });

    shouldBehaveLikeSet(accountA, accountB, accountC);
  });

  // UintSet
  describe('EnumerableUintSet', function() {
    const uintA = new BN('1234');
    const uintB = new BN('5678');
    const uintC = new BN('9101112');

    beforeEach(async function() {
      this.set = await EnumerableUintSetMock.new();
    });

    shouldBehaveLikeSet(uintA, uintB, uintC);
  });
});
