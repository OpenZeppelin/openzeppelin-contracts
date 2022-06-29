const { BN, constants } = require('@openzeppelin/test-helpers');

const AddressToUintMapMock = artifacts.require('AddressToUintMapMock');
const UintToAddressMapMock = artifacts.require('UintToAddressMapMock');
const Bytes32ToBytes32MapMock = artifacts.require('Bytes32ToBytes32MapMock');
const UintToUintMapMock = artifacts.require('UintToUintMapMock');
const Bytes32ToUintMapMock = artifacts.require('Bytes32ToUintMapMock');

const { shouldBehaveLikeMap } = require('./EnumerableMap.behavior');

contract('EnumerableMap', function (accounts) {
  const [ accountA, accountB, accountC ] = accounts;

  const keyA = new BN('7891');
  const keyB = new BN('451');
  const keyC = new BN('9592328');

  const bytesA = '0xdeadbeef'.padEnd(66, '0');
  const bytesB = '0x0123456789'.padEnd(66, '0');
  const bytesC = '0x42424242'.padEnd(66, '0');

  // AddressToUintMap
  describe('AddressToUintMap', function () {
    beforeEach(async function () {
      this.map = await AddressToUintMapMock.new();
    });

    shouldBehaveLikeMap(
      [ accountA, accountB, accountC ],
      [ keyA, keyB, keyC ],
      new BN('0'),
    );
  });

  // UintToAddressMap
  describe('UintToAddressMap', function () {
    beforeEach(async function () {
      this.map = await UintToAddressMapMock.new();
    });

    shouldBehaveLikeMap(
      [ keyA, keyB, keyC ],
      [ accountA, accountB, accountC ],
      constants.ZERO_ADDRESS,
    );
  });

  // Bytes32ToBytes32Map
  describe('Bytes32ToBytes32Map', function () {
    beforeEach(async function () {
      this.map = await Bytes32ToBytes32MapMock.new();
    });

    shouldBehaveLikeMap(
      [ keyA, keyB, keyC ].map(k => '0x' + k.toString(16).padEnd(64, '0')),
      [ bytesA, bytesB, bytesC ],
      constants.ZERO_BYTES32,
    );
  });

  // UintToUintMap
  describe('UintToUintMap', function () {
    beforeEach(async function () {
      this.map = await UintToUintMapMock.new();
    });

    shouldBehaveLikeMap(
      [ keyA, keyB, keyC ],
      [ keyA, keyB, keyC ].map(k => k.add(new BN('1332'))),
      new BN('0'),
    );
  });

  // Bytes32ToUintMap
  describe('Bytes32ToUintMap', function () {
    beforeEach(async function () {
      this.map = await Bytes32ToUintMapMock.new();
    });

    shouldBehaveLikeMap(
      [ bytesA, bytesB, bytesC ],
      [ keyA, keyB, keyC ],
      new BN('0'),
    );
  });
});
