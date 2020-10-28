const { BN } = require('@openzeppelin/test-helpers');

const EnumerableAddressSetMock = artifacts.require('EnumerableAddressSetMock');
const EnumerableUintSetMock = artifacts.require('EnumerableUintSetMock');

const { shouldBehaveLikeSet } = require('./EnumerableSet.behavior');

contract('EnumerableSet', function (accounts) {
  // AddressSet
  describe('EnumerableAddressSet', function () {
    const [ accountA, accountB, accountC ] = accounts;

    beforeEach(async function () {
      this.set = await EnumerableAddressSetMock.new();
    });

    shouldBehaveLikeSet(accountA, accountB, accountC);
  });

  // UintSet
  describe('EnumerableUintSet', function () {
    const uintA = new BN('1234');
    const uintB = new BN('5678');
    const uintC = new BN('9101112');

    beforeEach(async function () {
      this.set = await EnumerableUintSetMock.new();
    });

    shouldBehaveLikeSet(uintA, uintB, uintC);
  });
});
