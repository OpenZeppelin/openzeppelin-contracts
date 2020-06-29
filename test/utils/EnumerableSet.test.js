const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { BN } = require('@openzeppelin/test-helpers');

const EnumerableAddressSetMock = contract.fromArtifact('EnumerableAddressSetMock');
const EnumerableUintSetMock = contract.fromArtifact('EnumerableUintSetMock');
const EnumerableBytes32SetMock = contract.fromArtifact('EnumerableBytes32SetMock');

const { shouldBehaveLikeSet } = require('./EnumerableSet.behavior');

describe('EnumerableSet', function () {
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

  // Bytes32Set
  describe('EnumerableBytes32Set', function () {
    const bytes32A = web3.utils.soliditySha3('BYTES32A');
    const bytes32B = web3.utils.soliditySha3('BYTES32B');
    const bytes32C = web3.utils.soliditySha3('BYTES32C');

    beforeEach(async function () {
      this.set = await EnumerableBytes32SetMock.new();
    });

    shouldBehaveLikeSet(bytes32A, bytes32B, bytes32C);
  });
});
