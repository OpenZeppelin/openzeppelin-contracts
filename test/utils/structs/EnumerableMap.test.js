const { BN, constants } = require('@openzeppelin/test-helpers');

const EnumerableUintToAddressMapMock = artifacts.require('EnumerableUintToAddressMapMock');
const EnumerableBytes32ToBytes32MapMock = artifacts.require('EnumerableBytes32ToBytes32MapMock');

const { shouldBehaveLikeMap } = require('./EnumerableMap.behavior');

contract('EnumerableMap', function (accounts) {
  describe('EnumerableUintToAddressMapMock', function () {
    const [accountA, accountB, accountC] = accounts;

    const keyA = new BN('7891');
    const keyB = new BN('451');
    const keyC = new BN('9592328');

    beforeEach(async function () {
      this.map = await EnumerableUintToAddressMapMock.new();
    });

    shouldBehaveLikeMap(
      [keyA, keyB, keyC],
      [accountA, accountB, accountC],
      constants.ZERO_ADDRESS,
    );
  });

  describe('EnumerableBytes32ToBytes32MapMock', function () {
    const keyA = '0xffffffff'.padEnd(66, '0');
    const keyB = '0x987654321'.padEnd(66, '0');
    const keyC = '0x6262626262'.padEnd(66, '0');

    const bytesA = '0xdeadbeef'.padEnd(66, '0');
    const bytesB = '0x0123456789'.padEnd(66, '0');
    const bytesC = '0x42424242'.padEnd(66, '0');

    beforeEach(async function () {
      this.map = await EnumerableBytes32ToBytes32MapMock.new();
    });

    shouldBehaveLikeMap(
      [keyA, keyB, keyC],
      [bytesA, bytesB, bytesC],
      constants.ZERO_BYTES32,
    );
  });
});
